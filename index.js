const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const axios = require('axios');
const crypto = require('crypto');

// Configurare conexiune PostgreSQL
const pool = new Pool({
    //postgres://neondb_owner:npg_mHs2fpj5AhND@ep-red-bush-a2el9wq3-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
    connectionString: 'postgres://default:3oh5IOzwQqtJ@ep-throbbing-sunset-54063867.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require',
});

//postgres://default:3oh5IOzwQqtJ@ep-throbbing-sunset-54063867.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Adăugat pentru formulare HTML


async function sendFormAutomatically(transactionData) {
    console.log("Funcția sendFormAutomatically a fost apelată.");
    console.log("Datele tranzacției:", transactionData);

    const url = "https://ecomt.victoriabank.md/cgi-bin/cgi_link?";
    const trtype = 24;

    const formData = {
        AMOUNT: transactionData[3],
        CURRENCY: transactionData[4],
        ORDER: transactionData[2],
        DESC: "Description here",
        MERCH_NAME: "Merchant Name",
        MERCH_URL: "www.test.md",
        MERCHANT: transactionData[0],
        TERMINAL: transactionData[0],
        EMAIL: "examples@test.com",
        TRTYPE: trtype,
        COUNTRY: transactionData[4],
        NONCE: transactionData[11],
        BACKREF: "http://www.test.md/",
        MERCH_GMT: "2",
        TIMESTAMP: transactionData[10],
        P_SIGN: transactionData[12],
        LANG: "en",
        MERCH_ADDRESS: "Merchant Address",
        RRN: transactionData[8],
        INT_REF: transactionData[9],
    };

    try {
        console.log("Trimitere formular către:", url);
        const response = await axios.post(url, formData, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        console.log("Răspuns de la server:", response.data);
    } catch (error) {
        console.error("Eroare la trimiterea formularului:", error.message);
    }
}


// app.post('/save-data', async (req, res) => {
//     try {
//         console.log(req, 'cosole.log111')
//
//         // Extragem câmpurile din cererea primită
//         const {
//             TERMINAL,
//             TRTYPE,
//             ORDER,
//             AMOUNT,
//             CURRENCY,
//             ACTION,
//             RC,
//             APPROVAL,
//             RRN,
//             INT_REF,
//             TIMESTAMP,
//             NONCE,
//             P_SIGN,
//             ECI,
//             TEXT,
//             EMAIL
//         } = req.body;
//
//         console.log(req, 'cosole.log222')
//
//         const query = `
//             INSERT INTO transaction (TERMINAL, TRTYPE, "ORDER", AMOUNT, CURRENCY, ACTION, RC, APPROVAL, RRN, INT_REF, TIMESTAMP, NONCE, P_SIGN, ECI, TEXT, EMAIL)
//             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
//         `;
//
//         const values = [
//             TERMINAL, TRTYPE, ORDER, AMOUNT, CURRENCY, ACTION, RC,
//             APPROVAL, RRN, INT_REF, TIMESTAMP, NONCE, P_SIGN, ECI, TEXT, EMAIL
//         ];
//
//         await pool.query(query, values);
//
//
//         // console.log(`Value of RC: '${values[6]}'`);
//         // if (values[6]?.trim() === '00') {
//         //     console.log("Intrăm în if, RC este exact '00'.");
//         //     sendFormAutomatically(values);
//         // } else {
//         //     console.log("Nu intrăm în if. Valoarea RC este:", `'${values[6]}'`);
//         // }
//
//
//
//
//         res.status(200).json({ message: 'Datele au fost salvate cu succes.' });
//     } catch (error) {
//         console.error('Eroare la salvarea datelor:', error);
//         res.status(500).json({ message: 'Eroare la salvarea datelor.', error });
//     }
// });

app.post('/save-data', async (req, res) => {
    try {
        console.log(req.body, 'cosole.log111');

        // Extragem câmpurile din cererea primită
        const {
            TERMINAL,
            TRTYPE,
            ORDER,
            AMOUNT,
            CURRENCY,
            ACTION,
            RC,
            APPROVAL,
            RRN,
            INT_REF,
            TIMESTAMP,
            NONCE,
            P_SIGN,
            ECI,
            TEXT,
            EMAIL
        } = req.body;

        console.log(req.body, 'cosole.log222');

        const query = `
            INSERT INTO transaction (TERMINAL, TRTYPE, "ORDER", AMOUNT, CURRENCY, ACTION, RC, APPROVAL, RRN, INT_REF, TIMESTAMP, NONCE, P_SIGN, ECI, TEXT, EMAIL)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `;

        const values = [
            TERMINAL, TRTYPE, ORDER, AMOUNT, CURRENCY, ACTION, RC,
            APPROVAL, RRN, INT_REF, TIMESTAMP, NONCE, P_SIGN, ECI, TEXT, EMAIL
        ];

        await pool.query(query, values);

        // **Dacă TRTYPE este 0, se trimite automat o nouă cerere cu TRTYPE 21**
        if (TRTYPE === '0') {
            try {
                console.log("TRTYPE este 0, trimit cerere cu TRTYPE 21...");

                const newTrType = '21';
                const newNonce = crypto.randomBytes(16).toString('hex'); // Generăm un nonce nou
                const newTimestamp = new Date().toISOString().replace(/[-:.TZ]/g, ''); // Format timestamp YYMMDDhhmmss

                // Generăm semnătura P_SIGN
                const p_sign_data = `${ORDER.length}${ORDER}${newNonce.length}${newNonce}${newTimestamp.length}${newTimestamp}${newTrType.length}${newTrType}${AMOUNT.length}${AMOUNT}`;
                const secretKey = "0652cb0fb1ba45044d549641dcf0172067ed45e844bcb2bc"; // Cheia privată HEX
                const p_sign = crypto.createHmac('sha256', Buffer.from(secretKey, 'hex')).update(p_sign_data).digest('hex');

                // Construim payload-ul pentru request
                const payload = new URLSearchParams();
                payload.append('TERMINAL', TERMINAL);
                payload.append('TRTYPE', newTrType);
                payload.append('ORDER', ORDER);
                payload.append('AMOUNT', AMOUNT);
                payload.append('CURRENCY', CURRENCY);
                payload.append('TIMESTAMP', newTimestamp);
                payload.append('NONCE', newNonce);
                payload.append('P_SIGN', p_sign);

                // Trimitem request către bancă
                const response = await axios.post('https://ecomt.victoriabank.md/cgi-bin/cgi_link?', payload.toString(), {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });

                console.log('Răspuns de la bancă:', response.data);
            } catch (err) {
                console.error('Eroare la trimiterea către bancă:', err);
            }
        }

        res.status(200).json({ message: 'Datele au fost salvate cu succes.' });

    } catch (error) {
        console.error('Eroare la salvarea datelor:', error);
        res.status(500).json({ message: 'Eroare la salvarea datelor.', error });
    }
});


app.get('/get-data', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM transaction');
        res.status(200).json(result.rows); 
    } catch (error) {
        console.error('Eroare la obținerea datelor:', error);
        res.status(500).json({ message: 'Eroare la obținerea datelor.', error });
    }
});
 

app.post('/finalize-record', async (req, res) => {
    try {
        const { TERMINAL, ORDER, AMOUNT, CURRENCY, ACTION, RC, APPROVAL, RRN, INT_REF, TIMESTAMP, NONCE, P_SIGN, ECI, TEXT } = req.body;

        // Verificăm dacă tranzacția este deja finalizată
        const checkQuery = `
            SELECT 1 FROM transaction WHERE RRN = $1 AND TRTYPE = '21'
        `;
        const checkResult = await pool.query(checkQuery, [RRN]);

        if (checkResult.rowCount > 0) {
            return res.status(400).json({ message: 'Tranzacția este deja finalizată.' });
        }

        const insertQuery = `
            INSERT INTO transaction (TERMINAL, TRTYPE, "ORDER", AMOUNT, CURRENCY, ACTION, RC, APPROVAL, RRN, INT_REF, TIMESTAMP, NONCE, P_SIGN, ECI, TEXT)
            VALUES ($1, '21', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `;

        const values = [TERMINAL, ORDER, AMOUNT, CURRENCY, ACTION, RC, APPROVAL, RRN, INT_REF, TIMESTAMP, NONCE, P_SIGN, ECI, TEXT];
        await pool.query(insertQuery, values);

        res.status(200).json({ message: 'Înregistrarea a fost finalizată cu succes.' });
    } catch (error) {
        console.error('Eroare la finalizarea înregistrării:', error);
        res.status(500).json({ message: 'Eroare la finalizarea înregistrării.', error });
    }
});


app.post('/cancel-record', async (req, res) => {
    try {
        const { TERMINAL, ORDER, AMOUNT, CURRENCY, ACTION, RC, APPROVAL, RRN, INT_REF, TIMESTAMP, NONCE, P_SIGN, ECI, TEXT } = req.body;

        // Verificăm dacă tranzacția este deja anulată
        const checkQuery = `
            SELECT 1 FROM transaction WHERE RRN = $1 AND TRTYPE = '22'
        `;
        const checkResult = await pool.query(checkQuery, [RRN]);

        if (checkResult.rowCount > 0) {
            return res.status(400).json({ message: 'Tranzacția este deja anulată.' });
        }

        const insertQuery = `
            INSERT INTO transaction (TERMINAL, TRTYPE, "ORDER", AMOUNT, CURRENCY, ACTION, RC, APPROVAL, RRN, INT_REF, TIMESTAMP, NONCE, P_SIGN, ECI, TEXT)
            VALUES ($1, '22', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `;

        const values = [TERMINAL, ORDER, AMOUNT, CURRENCY, ACTION, RC, APPROVAL, RRN, INT_REF, TIMESTAMP, NONCE, P_SIGN, ECI, TEXT];
        await pool.query(insertQuery, values);

        res.status(200).json({ message: 'Înregistrarea a fost anulată cu succes.' });
    } catch (error) {
        console.error('Eroare la anularea înregistrării:', error);
        res.status(500).json({ message: 'Eroare la anularea înregistrării.', error });
    }
});


app.get('/get-pending-records', async (req, res) => {
    try {
        const query = `
            SELECT * FROM transaction t1
            WHERE t1.RC = '00' AND NOT EXISTS (
                SELECT 1 FROM transaction t2
                WHERE t2.RRN = t1.RRN AND t2.TRTYPE = '21'
            )
        `;

        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Eroare la obținerea înregistrărilor:', error);
        res.status(500).json({ message: 'Eroare la obținerea înregistrărilor.', error });
    }
});


app.get('/get-active-records', async (req, res) => {
    try {
        const query = `
           select * from transaction where rc = '00'
        `;

        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Eroare la obținerea înregistrărilor:', error);
        res.status(500).json({ message: 'Eroare la obținerea înregistrărilor.', error });
    }
});

app.get('/get-canceled-records', async (req, res) => {
    try {
        const query = `
            SELECT * FROM transaction t1
            WHERE t1.RC != '00' AND NOT EXISTS (
                SELECT 1 FROM transaction t2
                WHERE t2.RRN = t1.RRN AND t2.TRTYPE = '22'
            )
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Eroare la obținerea tranzacțiilor anulate:', error);
        res.status(500).json({ message: 'Eroare la obținerea tranzacțiilor anulate.', error });
    }
});

app.get('/filter-transactions', async (req, res) => {
    try {
        const { type } = req.query;

        // Verificăm dacă există tipul de tranzacție în query
        let query;
        let values = [];

        if (type) {
            // Filtrăm doar tranzacțiile cu tipul specificat
            query = `SELECT * FROM transaction WHERE TRTYPE = $1`;
            values = [type];
        } else {
            // Returnăm toate tranzacțiile dacă nu există un filtru
            query = `SELECT * FROM transaction`;
        }

        // Executăm interogarea cu sau fără parametri
        const result = await pool.query(query, values);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Eroare la filtrarea tranzacțiilor:', error);
        res.status(500).json({ message: 'Eroare la filtrarea tranzacțiilor.', error });
    }
});

app.listen(PORT, () => {
    console.log(`Serverul rulează pe http://localhost:${PORT}`);
});

 // CREATE TABLE transaction ( 
 //     TERMINAL TEXT,
 //     TRTYPE TEXT,
 //     "ORDER" TEXT,  
 //     AMOUNT TEXT,
 //     CURRENCY TEXT,
 //     ACTION TEXT,
 //     RC TEXT,
 //     APPROVAL TEXT,
 //     RRN TEXT,
 //     INT_REF TEXT,
 //     TIMESTAMP TEXT,
 //     NONCE TEXT,
 //     P_SIGN TEXT,
 //     ECI TEXT,
 //     TEXT TEXT
 // );





