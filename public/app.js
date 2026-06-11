let currentScreen = 1;
const totalScreens = 3;
const answers = {};
let quizStarted = false;

function updateProgress() {
    const progressPercent = (currentScreen / totalScreens) * 100;
    document.getElementById('progressFill').style.width = progressPercent + '%';
}

function showScreen(screenNumber) {
    document.querySelectorAll('.quiz-screen').forEach(screen => {
        screen.classList.remove('active');
    });

    if (screenNumber === 'loading') {
        document.getElementById('loading').classList.add('active');
    } else {
        document.getElementById(`screen${screenNumber}`).classList.add('active');
    }
}

function handleAnswer(question, answer) {
    answers[question] = answer;

    const questionNumber = question.replace('question', '');
    Analytics.trackQuestionAnswered(questionNumber, answer);

    if (currentScreen < totalScreens) {
        currentScreen++;
        updateProgress();
        showScreen(currentScreen);
    } else {
        Analytics.trackQuizCompleted(answers);
        showLoadingAndCheckout();
    }
}

async function showLoadingAndCheckout() {
    showScreen('loading');

    Analytics.trackCheckoutClicked(answers);

    setTimeout(async () => {
        try {
            const response = await fetch('/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ answers }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create checkout session');
            }

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL received');
            }
        } catch (error) {
            console.error('Error creating checkout:', error);

            showScreen('loading');
            document.getElementById('loading').innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h2 style="color: #e53e3e; margin-bottom: 16px;">⚠️ Connection Error</h2>
                    <p style="color: #666; margin-bottom: 24px;">Unable to connect to payment service. Please check your internet connection.</p>
                    <button onclick="location.reload()" style="padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">Try Again</button>
                </div>
            `;
        }
    }, 2000);
}

document.querySelectorAll('.option-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        if (!quizStarted) {
            Analytics.trackQuizStarted();
            quizStarted = true;
        }

        const button = e.currentTarget;
        button.disabled = true;

        const value = button.getAttribute('data-value');
        const screenId = button.closest('.quiz-screen').id;
        const questionNumber = screenId.replace('screen', '');

        handleAnswer(`question${questionNumber}`, value);
    });
});

updateProgress();