// index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sgMail = require("@sendgrid/mail");

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// ✅ API route to send emails
app.post("/send-email", async (req, res) => {
  try {
    const { subject, body, recipients } = req.body;

    // Validation
    if (!subject || !body || !recipients || recipients.length === 0) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Prepare messages
    const messages = recipients.map((r) => ({
      to: r.email,
      from: process.env.SENDER_EMAIL, // ✅ must be your verified sender
      subject,
      text: body.replace("{{name}}", r.name || "Customer"),
    }));

    // Send emails
    await sgMail.send(messages);

    res.json({ success: true, sent: recipients.length });
  } catch (err) {
    // Better error handling
    if (err.response) {
      console.error("SendGrid Error Response:", err.response.body);
    } else {
      console.error("Unexpected Error:", err.message);
    }
    res.status(500).json({ error: "Failed to send emails" });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
