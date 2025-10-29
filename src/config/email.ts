/**
 * @fileoverview Email service configuration for sending emails.
 * Supports SendGrid (recommended for production) and Gmail SMTP (for local development).
 * @module config/email
 */

import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

/**
 * Validates that required email credentials are configured in environment variables.
 * 
 * @returns {Object} Object with validation status
 * @returns {boolean} returns.valid - Indicates if all required variables are present
 * @returns {string[]} returns.missing - Array with names of missing variables
 */
const validateEmailConfig = (): { valid: boolean; missing: string[] } => {
  const requiredVars = ['EMAIL_USER', 'SENDGRID_API_KEY'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn(`Variables de email faltantes: ${missing.join(', ')}`);
    console.warn('El servicio de recuperación de contraseña no funcionará correctamente');
    return { valid: false, missing };
  }
  
  console.log('Todas las variables de email están configuradas');
  return { valid: true, missing: [] };
};

// Validate at startup (for logs only)
const initialCheck = validateEmailConfig();

/**
 * Creates and configures a Nodemailer transporter.
 * Prioritizes SendGrid if available (recommended for Render and production).
 * Otherwise, uses Gmail SMTP for local development.
 * 
 * @returns {nodemailer.Transporter} Configured transporter for sending emails
 */
const createTransporter = () => {
  // Si existe SENDGRID_API_KEY, usa SendGrid (recomendado para Render)
  if (process.env.SENDGRID_API_KEY) {
    console.log('Usando SendGrid para envío de emails');
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 2525,
      secure: false,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }
  
  // Fallback a Gmail (para desarrollo local)
  console.log('Usando Gmail SMTP para envío de emails');
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Configured email transporter ready to use.
 * @type {nodemailer.Transporter}
 */
export const transporter = createTransporter();

// Verify connection only if configured
if (initialCheck.valid) {
  transporter.verify(function (error: any, success: any) {
    if (error) {
      console.error('Error al conectar con el servidor de email:', error.message);
      console.error('Si estás en Render, asegúrate de usar SendGrid en lugar de Gmail SMTP');
    } else {
      console.log('Servidor de email listo para enviar mensajes');
      console.log(`Email configurado: ${process.env.EMAIL_USER}`);
    }
  });
} else {
  console.warn('Transporter de email no configurado - saltando verificación');
}

/**
 * Sends a password recovery email to the user.
 * Generates a link with the reset token that expires in 1 hour.
 * 
 * @async
 * @param {string} email - Recipient's email address
 * @param {string} resetToken - Unique token for password reset
 * @returns {Promise<boolean>} Promise that resolves to true if email was sent successfully
 * @throws {Error} If email configuration is incomplete or if sending fails
 * 
 * @example
 * await sendPasswordResetEmail('user@example.com', 'abc123token');
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
) => {
  // Validar configuración antes de enviar (validación en tiempo real)
  const config = validateEmailConfig();
  
  if (!config.valid) {
    console.error('No se puede enviar email. Variables faltantes:', config.missing);
    throw new Error(`Configuración de email incompleta. Faltan: ${config.missing.join(', ')}`);
  }

  const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetURL = `${frontendURL}/reset-password/${resetToken}`;

  console.log(`Preparando email de recuperación...`);
  console.log(`   Para: ${email}`);
  console.log(`   Desde: ${process.env.EMAIL_USER}`);
  console.log(`   URL de reseteo: ${resetURL}`);

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Tu App'}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Recuperación de Contraseña',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #21242c;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #363b47ff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Recuperación de Contraseña</h1>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            <div style="text-align: center;">
              <a href="${resetURL}" class="button">Restablecer Contraseña</a>
            </div>
            <p>O copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; color: #21242c;">${resetURL}</p>
            <p><strong>Este enlace expirará en 1 hora.</strong></p>
            <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.</p>
          </div>
          <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    // Create a new transporter to ensure we have the most recent configuration
    const currentTransporter = createTransporter();
    const info = await currentTransporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    console.log(`   MessageID: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error('Error sending email:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    
    // Show suggestions based on error
    if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
      console.error('SOLUTION: Render blocks SMTP. Configure SENDGRID_API_KEY in environment variables');
    }
    
    throw error;
  }
};
