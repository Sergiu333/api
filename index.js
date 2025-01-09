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
            ECI
        } = req.body;

        const query = `
            INSERT INTO test_table4 (TERMINAL, TRTYPE, "ORDER", AMOUNT, CURRENCY, ACTION, RC, APPROVAL, RRN, INT_REF, TIMESTAMP, NONCE, P_SIGN, ECI)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `;

        const values = [
            TERMINAL, TRTYPE, ORDER, AMOUNT, CURRENCY, ACTION, RC, 
            APPROVAL, RRN, INT_REF, TIMESTAMP, NONCE, P_SIGN, ECI
        ];

        await pool.query(query, values);
        res.status(200).json({ message: 'Datele au fost salvate cu succes.' });
    } catch (error) {
        console.error('Eroare la salvarea datelor:', error);
        res.status(500).json({ message: 'Eroare la salvarea datelor.', error });
    }
});

app.listen(PORT, () => {
    console.log(`Serverul rulează pe http://localhost:${PORT}`);
});



// SELECT * FROM test_table2 

// CREATE TABLE test_table2 (
//     TERMINAL TEXT,
//     TRTYPE TEXT,
//     ORDERR TEXT,  
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
//     ECI TEXT
// );

// CREATE TABLE test_table3 ( 
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
//     ECI TEXT
// );





