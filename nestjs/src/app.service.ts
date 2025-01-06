import { Injectable } from '@nestjs/common';
import { DatabasesService } from './database/database.service'; // Adjust path if necessary
import { Database } from './database/database.entity'; // Adjust path if necessary

@Injectable()
export class AppService {
  getHello(): string {
    return `
		<!DOCTYPE html>
		<html>
		<head>
			<title>My Button</title>
		</head>
		<body>
			<h1>Hello World!</h1>
      <h2>Enter Database Data</h1>
      <form onsubmit="event.preventDefault(); handleClick();">
        <label for="name">Name:</label>
        <input type="text" id="name" required><br><br>
        <label for="email">Email:</label>
        <input type="email" id="email" required><br><br>
        <button type="submit">Push Database datas!</button>
      </form>
			<button onclick="handleClick()">Get Database datas!</button>
			<div id="response"></div>
			<script>
				async function handleClick() {
					const response = await fetch('/api/click', { method: 'POST' });
					const data = await response.json();
					document.getElementById('response').innerText = data.message;
				}
			</script>
		</body>
		</html>
	`;
  }

  handleButtonClick(): { message: string } {
    return { message: 'Button was clicked!' };
  }
}
