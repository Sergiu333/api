const { Pool } = require('pg');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Configurare conexiune PostgreSQL
const pool = new Pool({
    connectionString: 'postgres://default:3oh5IOzwQqtJ@ep-throbbing-sunset-54063867.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require',
});

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Adăugat pentru formulare HTML

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

        const query = `
            INSERT INTO transaction (TERMINAL, TRTYPE, "ORDER", AMOUNT, CURRENCY, ACTION, RC, APPROVAL, RRN, INT_REF, TIMESTAMP, NONCE, P_SIGN, ECI, TEXT)
            VALUES ($1, '21', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `;

        const values = [TERMINAL, ORDER, AMOUNT, CURRENCY, ACTION, RC, APPROVAL, RRN, INT_REF, TIMESTAMP, NONCE, P_SIGN, ECI, TEXT];

        await pool.query(query, values);
        res.status(200).json({ message: 'Inregistrarea a fost finalizata cu succes.' });
    } catch (error) {
        console.error('Eroare la finalizarea înregistrării:', error);
        res.status(500).json({ message: 'Eroare la finalizarea înregistrării.', error });
    }
});

app.get('/get-pending-records', async (req, res) => {
    try {
        const query = `
            SELECT * FROM test_table4 t1
            WHERE t1.RC = '00' AND NOT EXISTS (
                SELECT 1 FROM test_table4 t2
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


app.listen(PORT, () => {
    console.log(`Serverul rulează pe http://localhost:${PORT}`);
});

 CREATE TABLE transaction ( 
     TERMINAL TEXT,
     TRTYPE TEXT,
     "ORDER" TEXT,  
     AMOUNT TEXT,
     CURRENCY TEXT,
     ACTION TEXT,
     RC TEXT,
     APPROVAL TEXT,
     RRN TEXT,
     INT_REF TEXT,
     TIMESTAMP TEXT,
     NONCE TEXT,
     P_SIGN TEXT,
     ECI TEXT,
     TEXT TEXT
 );





