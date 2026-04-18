import { createTransport } from "nodemailer";
import { ENV } from "./env";

const transporter = createTransport({
	service: "gmail",
	host: "smtp.gmail.com",
	auth: {
		user: ENV.EMAILADRESS,
		pass: ENV.EMAILPASSWORD,
	},
});
console.log([ENV.EMAILADRESS, ENV.EMAILPASSWORD]);

export async function sendEmail(
	subject: string,
	emailHtml: string,
	to: string,
) {
	try {
		await transporter.sendMail({
			from: ENV.EMAILADRESS,
			to: to,
			subject: subject,
			html: emailHtml,
		});
		return "email sent!";
	} catch (error) {
		console.log(error);
		return error;
	}
}








