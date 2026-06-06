const Axios = require('../handler/Axios');
const fs = require('fs');

const ExcelJS = require('exceljs');
const logs = require('../model/logs');

const sis_fields = fs.readFileSync(
  __dirname + '/../data/student-api-fields.json',
  'utf8',
);
const sis_fields_json = JSON.parse(sis_fields);

async function getStudentByBatch(campus_id, psupassports) {
  let queryStr = '';
  for (let i = 0; i < psupassports.length; i++) {
    if (i > 0) queryStr += '|';
    queryStr += `studentId=${encodeURIComponent(psupassports[i])}`;
  }
  const data = await Axios.psu.get(
    `regist/v3/student/gridify/${campus_id}?Filter=${queryStr}&PageSize=${psupassports.length}`,
    { validateStatus: false },
  );
  if (data.status !== 200) {
    return { error: 'Failed to fetch student data' };
  }
  return data.data.data;
}

async function getStudentByBatchName(campus_id, names) {
  let queryStr = '';
  for (let i = 0; i < names.length; i++) {
    if (i > 0) queryStr += '|';
    // studNameThai
    // studSnameThai
    queryStr += `(studNameThai=${encodeURIComponent(names[i][0])},studSnameThai=${encodeURIComponent(names[i][1])})`;
  }
  const data = await Axios.psu.get(
    `regist/v3/student/gridify/${campus_id}?Filter=${queryStr}&PageSize=${names.length}`,
    { validateStatus: false },
  );
  if (data.status !== 200) {
    return { error: 'Failed to fetch student data' };
  }
  return data.data.data;
}
async function searchStudents(searchBy, search, fieldsSearch) {
  let results = [];
  if (searchBy === 'psu_id') {
    // split 01 to 05
    let campus_dataset = [];
    for (let i = 1; i <= 5; i++) {
      let ss = search.filter((s) => {
        // get 3rd character
        // console.log(s);
        let txt3 = s.substring(2, 3);
        // console.log(i, txt3);
        return txt3 === `${i}`;
      });
      // console.log(ss);
      // push to array
      if (ss.length > 0)
        campus_dataset.push({
          campus_id: '0' + i,
          psu_id: ss,
        });
    }

    // fetch student by batch

    for (let camdata of campus_dataset) {
      let camp = camdata.campus_id;
      // split psu_id to batch of 100
      let psu_ids = camdata.psu_id;
      let batch_size = 100;
      let batch = [];
      for (let i = 0; i < psu_ids.length; i += batch_size) {
        batch.push(psu_ids.slice(i, i + batch_size));
      }

      let data = await Promise.all(
        batch.map(async (b) => await getStudentByBatch(camp, b)),
      );
      // flatten array
      data = data.flat();
      results = results.concat(data);
    }
  } else if (searchBy === 'name') {
    // search = [["Fname","Lname"],["Fname2","Lname2"]]
    // loop through campus 01 to 05
    let start_array = search;
    let starting_campuses = ['01', '02', '03', '04', '05'];
    for (let camp of starting_campuses) {
      // split names to batch of 50
      let batch_size = 50;
      let batch = [];
      for (let i = 0; i < search.length; i += batch_size) {
        batch.push(search.slice(i, i + batch_size));
      }

      let data = await Promise.all(
        batch.map(async (b) => await getStudentByBatchName(camp, b)),
      );
      // flatten array
      data = data.flat();
      results = results.concat(data);
      // filter out found names from start_array
      start_array = start_array.filter((name_pair) => {
        return !data.find(
          (student) =>
            student.studNameThai === name_pair[0] &&
            student.studSnameThai === name_pair[1],
        );
      });
      // if start_array is empty, break
      if (start_array.length === 0) break;
    }
  }
  // filter fields
  if (fieldsSearch && fieldsSearch.length > 0) {
    results = results.map((student) => {
      let filtered_student = {};
      for (let field of fieldsSearch) {
        // find field in sis_fields_json
        const field_info = sis_fields_json.find((f) => f.field_name === field);
        if (field_info) {
          // check if field has mapping
          /**
          "field_name": "studentId",
         "field_api": ["studentId"],
         */
          if (field_info.field_api) {
            // if field_api is array, get find all fields possible ang get first non-null value
            if (Array.isArray(field_info.field_api)) {
              for (let api_field of field_info.field_api) {
                if (
                  student[api_field] !== undefined &&
                  student[api_field] !== null
                ) {
                  filtered_student[field] = student[api_field];
                  break;
                }
              }
            } else {
              filtered_student[field] = student[field_info.field_api];
            }
          } else {
            filtered_student[field] = student[field];
          }
        }
      }

      filtered_student['studentId'] = student.studentId; // always include studentId
      filtered_student['studNameThai'] = student.studNameThai; // always include studNameThai
      filtered_student['studSnameThai'] = student.studSnameThai; // always include studSnameThai

      return filtered_student;
    });
  }

  let final_results = search.map((s) => {
    if (searchBy === 'psu_id') {
      return {
        search: s,
        result: results.find((r) => r.studentId === s) || { notFound: true },
      };
    } else if (searchBy === 'name') {
      return {
        search: s.join(' '),
        result: results.find(
          (r) => r.studNameThai === s[0] && r.studSnameThai === s[1],
        ) || { notFound: true },
      };
    }
  });
  return final_results;
}

module.exports = async (app, options) => {
  app.get(
    '/sis/fields',
    { preHandler: [app.verifyToken] },
    async (req, res) => {
      try {
        //get file student-api-fields.json
        const fields = sis_fields_json.filter((field) =>
          field.levels.includes(1),
        );

        return res.send(fields);
      } catch (error) {
        console.log(error);
        return res.code(500).send({ message: 'Internal Server Error' });
      }
    },
  );
  app.post(
    '/sis/search',
    { preHandler: [app.verifyToken] },
    async (req, res) => {
      let { searchBy, search, fieldsSearch } = req.body;

      // searchBy
      const result = await searchStudents(searchBy, search, fieldsSearch);

      new logs({
        adminId: req.user._id,
        action: 'sis_search',
        description: `Search By: ${searchBy}, Search Count: ${search.length}`,
        inputData: req.body,
        outputData: {
          resultCount: result.length,
          psu_ids: result.map((r) => r.result.studentId),
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }).save();

      return res.send(result);
    },
  );

  app.post(
    '/sis/export',
    { preHandler: [app.verifyToken] },
    async (req, res) => {
      let { searchBy, search, fieldsSearch } = req.body || {
        searchBy: 'name',
        search: [
          ['สัณหวัชร', 'แก้วยะรัตน์'],
          ['สรยุทธ', 'แก้วสุวรรณ์'],
          ['faefaef', 'feffaef'],
        ],
        fieldsSearch: [
          'studentId',
          'studNameThai',
          'studSnameThai',
          'studNameEng',
          'studSnameEng',
          'yearStatus',
          'campusNameThai',
          'facNameThai',
          'deptNameThai',
          'majorNameThai',
          'studyLevelName',
          'stillStudent',
        ],
      };
      const result = await searchStudents(searchBy, search, fieldsSearch);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Students');

      // add header row
      worksheet.columns = [
        { header: 'Search', key: 'search', width: 30 },
        ...fieldsSearch.map((field) => ({
          header: sis_fields_json.find((e) => e.field_api.includes(field))
            .field_title.th, // field name
          key: field,
          width: 20,
        })),
      ];

      // add data rows
      result.forEach((item) => {
        let row = { search: item.search };
        fieldsSearch.forEach((field) => {
          row[field] = item.result[field] || '';
        });
        worksheet.addRow(row);
      });

      // write to buffer
      const buffer = await workbook.xlsx.writeBuffer();

      res.header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      // res.header('Content-Disposition', 'attachment; filename="students.xlsx"');
      new logs({
        adminId: req.user._id,
        action: 'sis_export',
        description: `Export By: ${searchBy}, Export Count: ${search.length}`,
        inputData: req.body,
        outputData: {
          resultCount: result.length,
          psu_ids: result.map((r) => r.result.studentId),
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }).save();
      return res.send(buffer);
    },
  );

  app.post('/sis/find', async (req, res) => {
    return req.send({ message: 'Not Implemented' });
  });
};
