import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      studentEmail,
      courseName,
      offerType,
      discountPercent,
      customInstallment,
      customTotalPrice,
      salesEmail
    } = body;

    if (!studentEmail || !studentEmail.includes('@')) {
      return NextResponse.json({ error: 'Valid studentEmail is required' }, { status: 400 });
    }

    const smtpHost = process.env.SMTP_HOST || 'smtp.titan.email';
    const smtpPort = Number(process.env.SMTP_PORT) || 465;
    const smtpUser = process.env.SMTP_USER || 'Admissions@parhlopakistan.com.pk';
    const smtpPass = process.env.SMTP_PASS || 'Join@parhlo26';

    // Create primary transporter (SSL Port 465)
    let transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    let offerSummaryTitle = 'Private Student Offer';
    let offerDetailsHtml = '';

    if (offerType === 'independenceday_14') {
      offerSummaryTitle = '🇵🇰 14% Independence Day Special Discount';
      offerDetailsHtml = `
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 18px; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <h2 style="margin: 0 0 10px 0; color: #15803d; font-size: 18px;">🇵🇰 Happy Independence Day! 🎉</h2>
          <p style="margin: 0 0 12px 0; color: #166534; font-size: 14px; line-height: 1.6;">
            To celebrate Independence Day, an exclusive <strong>14% Independence Day Special Discount</strong> has been issued for your account by representative <strong>${salesEmail || 'Admissions Team'}</strong>!
          </p>
          <div style="background-color: #ffffff; padding: 12px 16px; border-radius: 8px; border: 1px solid #dcfce7;">
            <p style="margin: 0 0 6px 0; color: #15803d; font-size: 14px;">
              🏷️ Discounted Total Price: <strong>Rs. ${Number(customTotalPrice).toLocaleString()}</strong> (14% Off)
            </p>
            <p style="margin: 0; color: #15803d; font-size: 14px;">
              💳 Adjusted Monthly Installment: <strong>Rs. ${Number(customInstallment).toLocaleString()} / month</strong>
            </p>
          </div>
        </div>
      `;
    } else if (offerType === 'free_month_trial') {
      offerSummaryTitle = '1-Month Free Access Trial';
      offerDetailsHtml = `
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin: 0 0 8px 0; color: #15803d; font-size: 16px;">🎁 1-Month Free Access Granted!</h3>
          <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.5;">
            You have received <strong>1 Month of Free Access</strong> to <strong>${courseName}</strong>. You can start watching your lectures immediately without any initial payment!
          </p>
        </div>
      `;
    } else if (offerType === 'added_discount') {
      offerSummaryTitle = `${discountPercent}% Special Extra Discount`;
      offerDetailsHtml = `
        <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin: 0 0 8px 0; color: #1d4ed8; font-size: 16px;">🏷️ ${discountPercent}% Extra Discount Applied!</h3>
          <p style="margin: 0 0 6px 0; color: #1e40af; font-size: 14px;">
            Final Discounted Price: <strong>Rs. ${Number(customTotalPrice).toLocaleString()}</strong>
          </p>
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            Monthly Installment: <strong>Rs. ${Number(customInstallment).toLocaleString()} / month</strong>
          </p>
        </div>
      `;
    } else if (offerType === 'discounted_installment') {
      offerSummaryTitle = 'Custom Discounted Monthly Installment';
      offerDetailsHtml = `
        <div style="background-color: #faf5ff; border-left: 4px solid #9333ea; padding: 16px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin: 0 0 8px 0; color: #7e22ce; font-size: 16px;">💳 Custom Installment Offer</h3>
          <p style="margin: 0 0 6px 0; color: #6b21a8; font-size: 14px;">
            Reduced Monthly Installment: <strong>Rs. ${Number(customInstallment).toLocaleString()} / month</strong>
          </p>
          <p style="margin: 0; color: #6b21a8; font-size: 14px;">
            Total Course Price: <strong>Rs. ${Number(customTotalPrice).toLocaleString()}</strong>
          </p>
        </div>
      `;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Exclusive Private Offer - Parhlo Pakistan</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 30px 10px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: #16a34a; color: #ffffff; padding: 8px 18px; border-radius: 9999px; font-weight: bold; font-size: 14px; letter-spacing: 0.5px;">
              PARHLO PAKISTAN
            </div>
            <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 16px 0 4px 0;">
              🎉 You Received an Exclusive Private Offer!
            </h1>
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              Issued by representative: <strong>${salesEmail || 'Admissions Team'}</strong>
            </p>
          </div>

          <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
            <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 12px 0;">
              Dear Student,
            </p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
              Great news! A special private offer has been issued for your account for <strong>${courseName || 'your course'}</strong>.
            </p>

            ${offerDetailsHtml}

            <div style="background-color: #f8fafc; padding: 16px; border-radius: 10px; margin: 20px 0; border: 1px solid #e2e8f0;">
              <h4 style="margin: 0 0 8px 0; color: #334155; font-size: 14px;">Summary of Offer:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.6;">
                <li><strong>Course:</strong> ${courseName || 'Course'}</li>
                <li><strong>Offer Type:</strong> ${offerSummaryTitle}</li>
                <li><strong>Issued By:</strong> ${salesEmail || 'Admissions Team'}</li>
              </ul>
            </div>

            <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 15px; font-weight: 800;">📌 How to Claim Your Offer (Step-by-Step):</h3>
              <ol style="margin: 0; padding-left: 20px; color: #334155; font-size: 13px; line-height: 1.8; font-weight: 500;">
                <li><strong>Step 1:</strong> Go to <a href="https://parhlopakistan.com.pk" style="color: #16a34a; font-weight: bold;">parhlopakistan.com.pk</a> and <strong>Sign Up / Log In</strong> using this email (<strong>${studentEmail}</strong>).</li>
                <li><strong>Step 2:</strong> Navigate to your course page: <strong>${courseName || 'Course'}</strong>.</li>
                <li><strong>Step 3:</strong> View your <strong>Exclusive Private Offer Banner</strong> displayed at the top of the course page.</li>
                <li><strong>Step 4:</strong> Click <strong>"Claim Offer / Enroll Now"</strong> to activate your discount & access immediately!</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 30px 0 20px 0;">
              <a href="https://parhlopakistan.com.pk/courses/${courseSlug || ''}" style="background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);">
                Go to Course Page & Claim Offer →
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px; line-height: 1.5;">
              If you have any questions regarding your offer, simply reply to this email or contact your representative at <strong>${salesEmail || 'Admissions@parhlopakistan.com.pk'}</strong>.
            </p>
          </div>

          <div style="border-top: 1px solid #f1f5f9; margin-top: 28px; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">Parhlo Pakistan Admissions Team</p>
            <p style="margin: 4px 0 0 0;">Admissions@parhlopakistan.com.pk</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Parhlo Pakistan Admissions" <${smtpUser}>`,
      to: studentEmail.trim().toLowerCase(),
      replyTo: salesEmail && salesEmail.includes('@') ? salesEmail : smtpUser,
      subject: offerType === 'independenceday_14'
        ? `🇵🇰 Happy Independence Day! 14% Special Discount Issued - ${courseName || 'Parhlo Pakistan'}`
        : `🎉 Exclusive Private Offer Issued: ${courseName || 'Parhlo Pakistan'}`,
      html: htmlContent
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Offer email sent successfully via SSL 465:', info.messageId);
      return NextResponse.json({ success: true, messageId: info.messageId });
    } catch (primaryErr) {
      console.warn('Primary SSL (465) failed, trying STARTTLS (587):', primaryErr.message);
      
      // Fallback transporter (STARTTLS Port 587)
      const fallbackTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: 587,
        secure: false,
        auth: {
          user: smtpUser,
          pass: smtpPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const fallbackInfo = await fallbackTransporter.sendMail(mailOptions);
      console.log('Offer email sent successfully via TLS 587:', fallbackInfo.messageId);
      return NextResponse.json({ success: true, messageId: fallbackInfo.messageId });
    }
  } catch (error) {
    console.error('Error sending offer email:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
