const csv = require('csv-parser');
const fs = require('fs');

const CSV_FILE_PATH1 = '/home/sree/ipf/mun-backend/helpers/data/users.csv';
const CSV_FILE_PATH2 = '/home/sree/ipf/mun-backend/helpers/data/training.csv';
const CSV_RESULTS_PATH = '/home/sree/ipf/mun-backend/helpers/outputs/training.csv'

fs.writeFile(CSV_RESULTS_PATH, 'uid,name,email\n', err => { })
const outStream = fs.createWriteStream(CSV_RESULTS_PATH, { flags: 'a' });


fs.createReadStream(CSV_FILE_PATH1)
    .pipe(csv())
    .on('data', (row1) => {
        const { uuid, name, email } = row1;
        fs.createReadStream(CSV_FILE_PATH2)
            .pipe(csv())
            .on('data', (row2) => {
                const { name, email } = row2;
                if (row1.email == email) {
                    outStream.write(`${uuid},${name},${email}\n`)
                }
                else return
            })
    })