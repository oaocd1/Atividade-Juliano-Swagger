const API_BASE_URL = 'https://umfgcloud-autenticacao-service-7e27ead80532.herokuapp.com';

document.addEventListener('DOMContentLoaded', () => {
    const body = document.querySelector("body");
    const signInButton = document.querySelector("#signIn");
    const signUpButton = document.querySelector("#signUp");

    const loginForm = document.querySelector("#loginForm");
    const registerForm = document.querySelector("#registerForm");

    const loginMessageEl = document.querySelector("#loginMessage");
    const registerMessageEl = document.querySelector("#registerMessage");

    function showMessage(element, message, isError = true) {
        if (!element) return;
        element.textContent = message;
        element.className = isError ? 'form-message error' : 'form-message success';
    }

    function parseApiError(errorData) {
        if (errorData && errorData.message) {
            return errorData.message;
        }
        if (errorData && errorData.errors) {
            let messages = [];
            for (const key in errorData.errors) {
                if (errorData.errors[key] && Array.isArray(errorData.errors[key])) {
                    messages = messages.concat(errorData.errors[key]);
                }
            }
            if (messages.length > 0) return messages.join(' ');
        }
        if (typeof errorData === 'string') {
            try {
                const parsedError = JSON.parse(errorData);
                if (parsedError && parsedError.message) return parsedError.message;
            } catch (e) {

            }
            return errorData;
        }
        if (errorData && errorData.title) {
            return errorData.title;
        }
        return "Ocorreu um erro desconhecido.";
    }

    if (body) {
        body.className = "on-load";
    }


    if (signInButton) {
        signInButton.addEventListener("click", function() {
            if (body) body.className = "sign-in";
            showMessage(loginMessageEl, ''); 
            showMessage(registerMessageEl, '');
        });
    }

    if (signUpButton) {
        signUpButton.addEventListener("click", function() {
            if (body) body.className = "sign-up";
            showMessage(loginMessageEl, '');
            showMessage(registerMessageEl, '');
        });
    }
//registro
    if (registerForm) {
        registerForm.addEventListener("submit", async function(event) {
            event.preventDefault();
            showMessage(registerMessageEl, '');

            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                showMessage(registerMessageEl, "As senhas não coincidem!");
                return;
            }

            if (!email || !password) {
                showMessage(registerMessageEl, "Por favor, preencha e-mail, senha e confirmação de senha.");
                return;
            }

            try {

                const response = await fetch(`${API_BASE_URL}/Autenticacao/registar`, { // esse registAr quebro minha cabeça professor
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        email: email,
                        senha: password,
                        senhaConfirmada: confirmPassword
                    })
                });

                const responseText = await response.text();
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    data = responseText;
                }

                if (response.ok) {
                    showMessage(registerMessageEl, (data && typeof data === 'object' && data.message) || "Cadastro realizado com sucesso! Você será redirecionado para o login.", false);
                    setTimeout(() => {
                        if (body) body.className = "sign-in";
                        if (loginForm) loginForm.reset();
                        if (registerForm) registerForm.reset();
                        if (document.getElementById('loginEmail')) document.getElementById('loginEmail').value = email;
                        showMessage(loginMessageEl, "Cadastro efetuado! Faça o login para continuar.", false);
                    }, 3000);
                } else {
                    showMessage(registerMessageEl, parseApiError(data) || `Erro ${response.status}`);
                }

            } catch (error) {
                console.error("Registration error:", error);
                showMessage(registerMessageEl, "Erro de conexão ao tentar cadastrar. Verifique o console.");
            }
        });
    }

    //  login 
    if (loginForm) {
        loginForm.addEventListener("submit", async function(event) {
            event.preventDefault();
            showMessage(loginMessageEl, '');

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (!email || !password) {
                showMessage(loginMessageEl, "Por favor, preencha e-mail e senha.");
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/Autenticacao/autenticar`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        senha: password
                    })
                });

                const responseText = await response.text();
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (e) {
                    data = responseText;
                }

                if (response.ok) {
                    const token = data.token;
                    const expirationDateStr = data.dataExpiracao;

                    if (token && expirationDateStr) {
                        localStorage.setItem('authToken', token);
                        localStorage.setItem('userEmail', email);

                        const expirationDate = new Date(expirationDateStr).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                        });
                        localStorage.setItem('tokenExpiry', expirationDate);

                        window.location.href = `welcome.html`;
                    } else {
                        showMessage(loginMessageEl, "Resposta de login inválida. Token ou data de expiração não encontrados.");
                        console.warn("Login response missing token or expiration:", data);
                    }
                } else {
                    showMessage(loginMessageEl, parseApiError(data) || `Erro ${response.status}: Usuário ou senha inválidos.`);
                }

            } catch (error) {
                console.error("Login error:", error);
                showMessage(loginMessageEl, "Erro de conexão ao tentar fazer login. Verifique o console.");
            }
        });
    }
});
