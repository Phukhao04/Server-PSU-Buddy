const admin = require("../model/admin");
const Axios = require("../handler/Axios");
const { toCleanData } = require("../handler/utils");

module.exports = async (app, options) => {
  app.get("/admin", { preHandler: [app.verifyToken] }, async (req, res) => {
    try {
      const adm = await admin.find();
      return res.send(adm);
    } catch (error) {
      console.log(error);
      return res.code(500).send({ message: "Internal Server Error" });
    }
  });
  app.get("/admin/:id", { preHandler: [app.verifyToken] }, async (req, res) => {
    try {
      const { id } = req.params;
      const adm = await admin.findById(id);
      return res.send(adm);
    } catch (error) {
      console.log(error);
      return res.code(500).send({ message: "Internal Server Error" });
    }
  });
  app.post("/admin", { preHandler: [app.verifyToken] }, async (req, res) => {
    try {
      let data = req.body;
      data.createdBy = req.user._id;
      data.updatedBy = req.user._id;
      const newAdmin = new admin(req.body);
      const adm = await newAdmin.save();
      return res.send(adm);
    } catch (error) {
      console.log(error);
      return res.code(500).send({ message: "Internal Server Error" });
    }
  });
  app.put("/admin/:id", { preHandler: [app.verifyToken] }, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      updateData.updatedBy = req.user._id;
      const adm = await admin.findByIdAndUpdate(id, updateData, { new: true });
      return res.send(adm);
    } catch (error) {
      console.log(error);
      return res.code(500).send({ message: "Internal Server Error" });
    }
  });
  app.delete(
    "/admin/:id",
    { preHandler: [app.verifyToken] },
    async (req, res) => {
      try {
        const { id } = req.params;
        await admin.findByIdAndDelete(id);
        return res.send({ message: "Admin deleted successfully" });
      } catch (error) {
        console.log(error);
        return res.code(500).send({ message: "Internal Server Error" });
      }
    },
  );

  app.get("/admin/psu-search", async (req, res) => {
    const { query } = req.query;

    try {
      // สร้าง array ของ promise สำหรับแต่ละ API
      const [
        staffid,
        staffname,
        staffusername,
        studentid01,
        studentid02,
        studentid03,
        studentid04,
        studentid05,
      ] = await Promise.all([
        Axios.psu.get(
          `Personnel/GetStaffDetailsByOrgUnit/${encodeURIComponent(query)}`,
          { validateStatus: false },
        ),
        Axios.psu.get(
          `Personnel/GetStaffDetailsByStaffNameOrSurName/${encodeURIComponent(query)}`,
          { validateStatus: false },
        ),
        Axios.psu.get(
          `Personnel/GetStaffDetailsByUserName/${encodeURIComponent(query)}`,
          { validateStatus: false },
        ),
        Axios.psu.get(
          `regist/v3/student/gridify/01?Filter=studentId=${encodeURIComponent(query)}|studNameThai=*${encodeURIComponent(query)}|studSnameThai=*${encodeURIComponent(query)}`,
          { validateStatus: false },
        ),
        Axios.psu.get(
          `regist/v3/student/gridify/02?Filter=studentId=${encodeURIComponent(query)}|studNameThai=*${encodeURIComponent(query)}|studSnameThai=*${encodeURIComponent(query)}`,
          { validateStatus: false },
        ),
        Axios.psu.get(
          `regist/v3/student/gridify/03?Filter=studentId=${encodeURIComponent(query)}|studNameThai=*${encodeURIComponent(query)}|studSnameThai=*${encodeURIComponent(query)}`,
          { validateStatus: false },
        ),
        Axios.psu.get(
          `regist/v3/student/gridify/04?Filter=studentId=${encodeURIComponent(query)}|studNameThai=*${encodeURIComponent(query)}|studSnameThai=*${encodeURIComponent(query)}`,
          { validateStatus: false },
        ),
        Axios.psu.get(
          `regist/v3/student/gridify/05?Filter=studentId=${encodeURIComponent(query)}|studNameThai=*${encodeURIComponent(query)}|studSnameThai=*${encodeURIComponent(query)}`,
          { validateStatus: false },
        ),
      ]);

      // แปลงข้อมูล staff
      const staffidconverted =
        staffid.status === 200
          ? staffid.data?.data?.map((staff) => ({
              ...staff,
              _id: staff.staffId,
              type: "staff",
            })) || []
          : [];

      const staffnameconverted =
        staffname.status === 200
          ? staffname.data?.data?.map((staff) => ({
              ...staff,
              _id: staff.staffId,
              type: "staff",
            })) || []
          : [];

      const staffusernameconverted =
        staffusername.status === 200
          ? staffusername.data?.data?.map((staff) => ({
              ...staff,
              _id: staff.staffId,
              type: "staff",
            })) || []
          : [];

      // แปลงข้อมูล student
      const studentid01converted =
        studentid01.status === 200
          ? studentid01.data?.data?.map((student) => ({
              ...student,
              _id: student.studentId,
              type: "student",
            })) || []
          : [];

      const studentid02converted =
        studentid02.status === 200
          ? studentid02.data?.data?.map((student) => ({
              ...student,
              _id: student.studentId,
              type: "student",
            })) || []
          : [];

      const studentid03converted =
        studentid03.status === 200
          ? studentid03.data?.data?.map((student) => ({
              ...student,
              _id: student.studentId,
              type: "student",
            })) || []
          : [];

      const studentid04converted =
        studentid04.status === 200
          ? studentid04.data?.data?.map((student) => ({
              ...student,
              _id: student.studentId,
              type: "student",
            })) || []
          : [];

      const studentid05converted =
        studentid05.status === 200
          ? studentid05.data?.data?.map((student) => ({
              ...student,
              _id: student.studentId,
              type: "student",
            })) || []
          : [];

      // รวมข้อมูลทั้งหมด
      const allStaff = [
        ...staffidconverted,
        ...staffnameconverted,
        ...staffusernameconverted,
        ...studentid01converted,
        ...studentid02converted,
        ...studentid03converted,
        ...studentid04converted,
        ...studentid05converted,
      ];

      // กรองให้เหลือแค่ _id ไม่ซ้ำ
      const uniqueStaffMap = new Map();
      allStaff.forEach((item) => {
        if (item && item._id) {
          uniqueStaffMap.set(item._id, item);
        }
      });

      const finalData = Array.from(uniqueStaffMap.values()).map((e) =>
        toCleanData(e.type, e),
      );

      // Return the unique staff list
      // return res.status(200).send(Array.from(uniqueStaffMap.values()))
      return res.status(200).send(finalData);
    } catch (error) {
      console.error("Error fetching PSU list:", error);
      return res.status(500).send({ message: langs.serverError });
    }
  });
};
