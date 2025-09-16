const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sgMail = require("@sendgrid/mail");

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" })); // increased limit for attachments

// ✅ API route to send emails
app.post("/send-email", async (req, res) => {
  try {
    const { subject, body, recipients, file } = req.body;

    if (!subject || !body || !recipients || recipients.length === 0) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // Prepare messages
    const messages = recipients.map((r) => {
      const msg = {
        to: r.email,
        from: process.env.SENDER_EMAIL, // must be verified
        subject,
        text: body.replace("{{name}}", r.name || "Customer"),
      };

      // ✅ Attach file if provided
      if (file && file.content && file.name) {
        msg.attachments = [
          {
            content: file.content,
            filename: file.name,
            type:
              file.type ||
              (file.name.endsWith(".pdf")
                ? "application/pdf"
                : file.name.endsWith(".jpg") || file.name.endsWith(".jpeg")
                ? "image/jpeg"
                : file.name.endsWith(".png")
                ? "image/png"
                : "application/octet-stream"),
            disposition: "attachment",
          },
        ];
        console.log(`Attachment included: ${file.name} (${msg.attachments[0].type})`);
      }

      return msg;
    });

    // ✅ Send emails
    await sgMail.send(messages);

    res.json({ success: true, sent: recipients.length });
  } catch (err) {
    if (err.response) {
      console.error("SendGrid Error Response:", err.response.body);
    } else {
      console.error("Unexpected Error:", err.message);
    }
    res.status(500).json({ error: "Failed to send emails" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
