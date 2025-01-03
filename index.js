const { Pool } = require('pg');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Configurare conexiune PostgreSQL
const pool = new Pool({
    connectionString: 'postgres://default:3oh5IOzwQqtJ@ep-throbbing-sunset-54063867.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require',
});

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Permite trimiterea datelor prin formular URL-encoded

// Endpoint pentru salvarea datelor
app.post('/save-data', async (req, res) => {
    const data = req.body;

    if (Object.keys(data).length !== 14) {
        return res.status(400).json({ message: 'Trebuie să trimiți exact 14 câmpuri.' });
    }

    try {
        const query = `
            INSERT INTO my_table2 (
                TERMINAL, TRTYPE, ORDERR, AMOUNT, CURRENCY, ACTION, RC, APPROVAL, RRN, INT_REF, NONCE, P_SIGN, ECI
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `;
        const values = Object.values(data);

        await pool.query(query, values);
        res.status(201).json({ message: 'Datele au fost salvate cu succes.' });
    } catch (error) {
        console.error('Eroare la salvarea datelor:', error);
        res.status(500).json({ message: 'Eroare la salvarea datelor.', error });
    }
});

// Endpoint pentru citirea datelor
app.get('/get-data', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM my_table2');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Eroare la citirea datelor:', error);
        res.status(500).json({ message: 'Eroare la citirea datelor.', error });
    }
});

app.listen(PORT, () => {
    console.log(`Serverul rulează pe http://localhost:${PORT}`);
});
