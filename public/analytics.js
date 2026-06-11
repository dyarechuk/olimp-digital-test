const Analytics = (() => {
    let provider = null;
    let isEnabled = false;

    const providers = {
        google: {
            init: (measurementId) => {
                if (!measurementId) {
                    console.warn('Google Analytics: Measurement ID not provided');
                    return false;
                }

                const script1 = document.createElement('script');
                script1.async = true;
                script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
                document.head.appendChild(script1);

                window.dataLayer = window.dataLayer || [];
                function gtag() { dataLayer.push(arguments); }
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', measurementId);

                return true;
            },
            track: (eventName, eventData) => {
                if (window.gtag) {
                    window.gtag('event', eventName, eventData);
                }
            }
        },

        console: {
            init: () => {
                console.log('[Analytics] Console provider initialized');
                return true;
            },
            track: (eventName, eventData) => {
                console.log(`[Analytics Event] ${eventName}`, eventData);
            }
        }
    };

    return {
        init: (providerName = 'console', config = {}) => {
            if (!providers[providerName]) {
                console.error(`Analytics provider "${providerName}" not found`);
                return;
            }

            provider = providers[providerName];
            isEnabled = provider.init(config.measurementId || config.apiKey);

            if (isEnabled) {
                console.log(`Analytics initialized with provider: ${providerName}`);
            }
        },

        track: (eventName, eventData = {}) => {
            if (!isEnabled || !provider) {
                return;
            }

            provider.track(eventName, {
                ...eventData,
                timestamp: new Date().toISOString()
            });
        },

        trackQuizStarted: () => {
            Analytics.track('quiz_started', {
                event_category: 'quiz',
                event_label: 'Quiz Flow Started'
            });
        },

        trackQuestionAnswered: (questionNumber, answer) => {
            Analytics.track('question_answered', {
                event_category: 'quiz',
                event_label: `Question ${questionNumber}`,
                question_number: questionNumber,
                answer: answer
            });
        },

        trackQuizCompleted: (answers) => {
            Analytics.track('quiz_completed', {
                event_category: 'quiz',
                event_label: 'All Questions Answered',
                total_questions: Object.keys(answers).length
            });
        },

        trackCheckoutClicked: (answers) => {
            Analytics.track('checkout_clicked', {
                event_category: 'conversion',
                event_label: 'Redirect to Stripe Checkout',
                total_questions: Object.keys(answers).length
            });
        }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Analytics;
}