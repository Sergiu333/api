const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const axios = require('axios');

// Configurare conexiune PostgreSQL
const pool = new Pool({
    connectionString: 'postgres://default:3oh5IOzwQqtJ@ep-throbbing-sunset-54063867.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require',
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Adăugat pentru formulare HTML


async function sendFormAutomatically(transactionData) {
    const formAction = "https://ecomt.victoriabank.md/cgi-bin/cgi_link?";

    try {
        const response = await axios.post(formAction, {
            AMOUNT: transactionData.AMOUNT,
            CURRENCY: transactionData.CURRENCY,
            ORDER: transactionData.ORDER,
            TEXT: transactionData.TEXT,
            TERMINAL: transactionData.TERMINAL,
            NONCE: transactionData.NONCE,
            TIMESTAMP: transactionData.TIMESTAMP,
            P_SIGN: transactionData.P_SIGN,
            RRN: transactionData.RRN,
            INT_REF: transactionData.INT_REF,
        });

        console.log("Formular trimis cu succes:", response.data);
    } catch (error) {
        console.error("Eroare la trimiterea formularului:", error.message);
    }
}

app.post('/save-data', async (req, res) => {
    try {
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
            TEXT
        } = req.body;

        const query = `
            INSERT INTO transaction (TERMINAL, TRTYPE, "ORDER", AMOUNT, CURRENCY, ACTION, RC, APPROVAL, RRN, INT_REF, TIMESTAMP, NONCE, P_SIGN, ECI, TEXT)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `;

        const values = [
            TERMINAL, TRTYPE, ORDER, AMOUNT, CURRENCY, ACTION, RC, 
            APPROVAL, RRN, INT_REF, TIMESTAMP, NONCE, P_SIGN, ECI, TEXT
        ];

        await pool.query(query, values);
        

        console.log(`Value of RC: '${values[6]}'`);
        if (values[6] === '00') {
            console.log("Intrăm în if");
            sendFormAutomatically(values);
        } else {
            console.log("Nu intrăm în if. Valoarea RC este:", values[6]);
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





