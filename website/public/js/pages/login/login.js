/* Login JavaScript - read the input fields and handle form submission */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('form');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // For now, don't send to the server, just log the values to the console
        console.log('Email:', email);
        console.log('Password:', password); 

        // TODO: Implement actual login logic here, such as sending a POST request to the server with the email and password
    });
});