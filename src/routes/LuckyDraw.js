const luckyDrawPersonal = require('../service/LuckyDrawPersonalManage');
const PsuAPIService = require('../service/PsuAPIService');

module.exports = (app, options) => {

  app.get(
    '/liff/lucky-draw/',
    {
      preHandler: [app.verifyLiffToken],
    },
    async (req, res) => {
      try {
        const userId = req.user._id;



        const result_lineid = await new luckyDrawPersonal('lineID', req.user.lineId).getPersonalEntries();
        const result_psuid = await new luckyDrawPersonal('psuID', req.user._id).getPersonalEntries();
        // Merge results and remove duplicates
        const combinedResults = [...result_lineid, ...result_psuid];
        const uniqueResultsMap = new Map();
        combinedResults.forEach((entry) => {
          uniqueResultsMap.set(entry._id.toString(), entry);
        }
        );
        const uniqueResults = Array.from(uniqueResultsMap.values());
        return res.send(uniqueResults);
      } catch (error) {
        console.error('Error participating in lucky draw:', error);
        return res.status(500).send({ error: 'Internal Server Error' });
      }
    },
  );
}

