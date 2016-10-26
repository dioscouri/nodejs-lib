/**
 *
 * Created by Yuriy Bushev <bushevuv@gmail.com> on 26/10/2016.
 */

'use strict';

/**
 * Excel Workbook Manager
 *
 * @type {*|exports|module.exports}
 */
const Excel = require('exceljs');

let workbook = new Excel.stream.xlsx.WorkbookWriter({
    filename: './streamed-workbook.xlsx'
});

let worksheet = workbook.addWorksheet('work-sheet');

worksheet.columns = [
    {header: 'Id', key: 'id', width: 10},
    {header: 'Name', key: 'name', width: 30}
];

worksheet.addRow({
    id: 1,
    name: 'Yury'
});

worksheet.addRow({
    id: 2,
    name: 'Eugene'
});

worksheet.commit();

workbook.commit().then(() => {

    console.log('Done!');
});