'use strict';

const Excel = require('exceljs');
const http = require('http');
const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/excel-test');

let Item = mongoose.model('item', {
    field: String
});

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

    let stream = Item.find({}).cursor();

    stream.on('data', data => {

        worksheet.addRow(data);
    });

    stream.on('end', () => {

        worksheet.commit();

        workbook.commit().then(() => {

            console.log('done');
        });
    });

    stream.on('error', err => {

        console.log(err);
    });

}).listen(2000);