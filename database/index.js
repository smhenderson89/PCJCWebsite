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
    const googleSheets = google.sheets({ version: "v3", auth: client });

    const spreadsheetId = process.env.SHEET_ID

    // Get metadata about spreadsheet
    const metaData = await googleSheets.spreadsheets.get({
        auth,
        spreadsheetId,
      });


    res.send(metaData)
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })