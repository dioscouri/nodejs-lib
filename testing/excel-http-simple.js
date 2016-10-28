'use strict';

const Excel = require('exceljs');
const http = require('http');
const async = require('async');

http.createServer((request, response) => {

    let workbook = new Excel.stream.xlsx.WorkbookWriter({
        stream: response
    });

    let worksheet = workbook.addWorksheet('work-sheet');

    worksheet.columns = [{header: 'field', key: 'field'}];

    response.writeHead(200, {
        'Content-Disposition': `attachment; filename="export.xlsx"`,
        'Transfer-Encoding': 'chunked',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    let count = 0;

    async.whilst(() => {

        return count < 1000;

    }, callback => {

        count++;

        console.log(`Write row ${count}`);

        worksheet.addRow({field: 'test'}).commit();

        setTimeout(() => {
            callback(null, count);
        }, 1000);

    }, (err, n) => {

        workbook.commit().then(() => {

            console.log('done');
        });
    });

}).listen(2000);
