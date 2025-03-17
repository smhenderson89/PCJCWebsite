// Load env variable
require('dotenv').config()

const express = require("express");
const { google } = require("googleapis");
const port = 3000;


const app = express();

app.get("/", async (req, res) => {
    const auth = new google.auth.GoogleAuth({
        keyFile: "secrets.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",

    });

    // Create client instance for auth
    const client = await auth.getClient();

    // Instance of Google Sheets API
    const googleSheets = google.sheets({ version: "v4", auth: client });

    // Get metadata about spreadsheet
    // const metaData = await googleSheets.spreadsheets.get({
    //     auth,
    //     SHEET_ID
    // });

    res.send("Hello World")
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })