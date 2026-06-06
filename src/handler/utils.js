exports.toUser = (baseApi, user) => {
  if (baseApi === 'personnel') {
    return {
      psuId: user.staffId.trim(),
      psuType: 'staff',
      name: {
        th: formatStr(`${user.staffNameThai} ${user.staffSnameThai}`),
        en: formatStr(`${user.staffNameEng} ${user.staffSnameEng}`),
      },

      campusId: user.campId,
      facId: user.facId,
      deptId: user.deptId,

      campusName: {
        th: formatStr(user.campNameThai),
        en: formatStr(user.campNameEng),
      },
      facName: {
        th: formatStr(user.facNameThai),
        en: formatStr(user.campNameEng),
      },
      deptName: {
        th: formatStr(user.deptNameThai),
        en: formatStr(user.campNameEng),
      },
      ...user,
    };
  } else if (baseApi === 'student') {
    return {
      psuId: user.studentId.trim(),
      psuType: 'student',
      name: {
        th: formatStr(`${user.studNameThai} ${user.studSnameThai}`),
        en: formatStr(`${user.studNameEng} ${user.studSnameEng}`),
      },

      campusId: user.campusId,
      facId: user.facId,
      deptId: user.deptId,

      campusName: {
        th: formatStr(user.campusNameThai),
        en: formatStr(user.campNameEng),
      },
      facName: {
        th: formatStr(user.facNameThai),
        en: formatStr(user.facNameEng),
      },
      deptName: {
        th: formatStr(user.deptNameThai),
        en: formatStr(user.deptNameEng),
      },
      ...user,
    };
  }
  return null;
};

const formatStr = (str) => {
  if (!str) return '';
  const text = str.trim().replace(/\s\s+/g, ' ');
  const words = text.toLowerCase().split(' ');
  let capitalized = [];

  for (let word of words)
    capitalized.push(word.charAt(0).toUpperCase() + word.slice(1));

  return capitalized.join(' ');
};

exports.toCleanData = (baseApi, user) => {
  if (baseApi === 'staff') {
    return {
      psuId: user.staffId.trim(),
      name: {
        th: formatStr(`${user.staffNameThai} ${user.staffSnameThai}`),
        en: formatStr(`${user.staffNameEng} ${user.staffSnameEng}`),
      },

      campusId: user.campId,
      facId: user.facId,
      deptId: user.deptId,

      campusName: {
        th: formatStr(user.campNameThai),
        en: formatStr(user.campNameEng),
      },
      facName: {
        th: formatStr(user.facNameThai),
        en: formatStr(user.campNameEng),
      },
      deptName: {
        th: formatStr(user.deptNameThai),
        en: formatStr(user.campNameEng),
      },
      ...user,
    };
  } else if (baseApi === 'student') {
    return {
      psuId: user.studentId.trim(),
      name: {
        th: formatStr(`${user.studNameThai} ${user.studSnameThai}`),
        en: formatStr(`${user.studNameEng} ${user.studSnameEng}`),
      },

      campusId: user.campusId,
      facId: user.facId,
      deptId: user.deptId,

      campusName: {
        th: formatStr(user.campusNameThai),
        en: formatStr(user.campNameEng),
      },
      facName: {
        th: formatStr(user.facNameThai),
        en: formatStr(user.facNameEng),
      },
      deptName: {
        th: formatStr(user.deptNameThai),
        en: formatStr(user.deptNameEng),
      },
      ...user,
    };
  }
  return null;
};