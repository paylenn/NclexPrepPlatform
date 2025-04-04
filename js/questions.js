/**
 * Questions functionality for practice pages and NGN examples
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Questions script loaded');
    
    // Initialize NGN examples if on the ngn-types page
    if (window.location.pathname.includes('ngn-types.html')) {
        initializeNGNExamples();
    }
    
    // Initialize practice exam if on the practice page
    if (window.location.pathname.includes('practice.html')) {
        initializePracticeExam();
    }
});

/**
 * Initialize the practice exam functionality
 */
function initializePracticeExam() {
    console.log('Initializing practice exam');
    
    // Check URL parameters for exam type
    const urlParams = new URLSearchParams(window.location.search);
    const examType = urlParams.get('exam');
    
    setupExamQuestions(examType || 'exam1');
}

/**
 * Setup the exam questions based on the exam type
 * @param {string} examType - The type of exam to load
 */
function setupExamQuestions(examType) {
    // Load questions from JSON file
    fetch('/data/practice-questions.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            let questions;
            
            // Check for the exam type in the data
            if (data[examType] && data[examType].items && Array.isArray(data[examType].items)) {
                questions = data[examType].items;
                
                // Set title based on exam type
                let examTitle = data[examType].title || 'NCLEX Practice Questions';
                if (document.getElementById('exam-title')) {
                    document.getElementById('exam-title').textContent = examTitle;
                }
            } else {
                console.error('Exam type not found or invalid structure:', examType);
                throw new Error('Exam data not found or in an unexpected format');
            }
            
            // Save questions to session storage
            sessionStorage.setItem('currentQuestions', JSON.stringify(questions));
            
            // Update total questions count if element exists
            if (document.getElementById('total-questions')) {
                document.getElementById('total-questions').textContent = questions.length;
            }
            
            // Display first question
            displayQuestion(0);
            
            // Setup next/prev buttons if they exist
            if (document.getElementById('next-btn')) {
                document.getElementById('next-btn').addEventListener('click', () => {
                    const currentIndex = parseInt(document.getElementById('current-question').textContent) - 1;
                    if (currentIndex < questions.length - 1) {
                        displayQuestion(currentIndex + 1);
                    }
                });
            }
            
            if (document.getElementById('prev-btn')) {
                document.getElementById('prev-btn').addEventListener('click', () => {
                    const currentIndex = parseInt(document.getElementById('current-question').textContent) - 1;
                    if (currentIndex > 0) {
                        displayQuestion(currentIndex - 1);
                    }
                });
            }
            
            // Setup show answer button if it exists
            if (document.getElementById('show-answer-btn')) {
                document.getElementById('show-answer-btn').addEventListener('click', () => {
                    const currentIndex = parseInt(document.getElementById('current-question').textContent) - 1;
                    showAnswerRationale(currentIndex);
                });
            }
            
            // Setup finish exam button if it exists
            if (document.getElementById('finish-exam-btn')) {
                document.getElementById('finish-exam-btn').addEventListener('click', showExamResults);
            }
        })
        .catch(error => {
            console.error('Error loading questions:', error);
            
            // Show a user-friendly error message
            const questionContainer = document.querySelector('.question-container');
            if (questionContainer) {
                questionContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <h4>Error Loading Questions</h4>
                        <p>We encountered an error while loading the practice questions. Please try refreshing the page.</p>
                        <button class="btn btn-primary mt-3" onclick="location.reload()">Refresh Page</button>
                    </div>
                `;
            }
        });
}

/**
 * Display a specific question
 * @param {number} index - The index of the question to display
 */
function displayQuestion(index) {
    try {
        const questions = JSON.parse(sessionStorage.getItem('currentQuestions'));
        const question = questions[index];
        
        if (!question) {
            throw new Error(`Question at index ${index} not found`);
        }
        
        // Get elements (check if they exist first)
        const currentQuestionEl = document.getElementById('current-question');
        const questionStemEl = document.getElementById('question-stem');
        const optionsContainer = document.getElementById('question-options');
        const rationaleContainer = document.getElementById('answer-rationale');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        // Update current question number if element exists
        if (currentQuestionEl) {
            currentQuestionEl.textContent = index + 1;
        }
        
        // Update question content if element exists
        if (questionStemEl) {
            // Use the text field for the question stem
            const questionText = question.text;
            questionStemEl.innerHTML = questionText;
        }
        
        // Update options if container exists
        if (optionsContainer) {
            optionsContainer.innerHTML = '';
            
            // Check if choices exist in the question object
            const options = question.choices;
            if (!options || !Array.isArray(options)) {
                optionsContainer.innerHTML = '<div class="alert alert-warning">No answer options available for this question.</div>';
                return;
            }
            
            options.forEach((option, i) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'option';
                optionElement.innerHTML = `
                    <div class="option-marker">${String.fromCharCode(65 + i)}</div>
                    <div class="option-text">${option}</div>
                `;
                
                // Add click handler
                optionElement.addEventListener('click', function() {
                    // Remove selected class from all options
                    document.querySelectorAll('.option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    
                    // Add selected class to clicked option
                    this.classList.add('selected');
                    
                    // Save answer
                    const answers = JSON.parse(sessionStorage.getItem('examAnswers') || '{}');
                    answers[index] = i;
                    sessionStorage.setItem('examAnswers', JSON.stringify(answers));
                });
                
                optionsContainer.appendChild(optionElement);
            });
            
            // Check if there's a saved answer for this question
            const answers = JSON.parse(sessionStorage.getItem('examAnswers') || '{}');
            if (answers[index] !== undefined) {
                const optionElements = optionsContainer.querySelectorAll('.option');
                if (optionElements.length > answers[index]) {
                    optionElements[answers[index]].classList.add('selected');
                }
            }
        }
        
        // Hide rationale when switching questions
        if (rationaleContainer) {
            rationaleContainer.classList.add('hidden');
        }
        
        // Disable previous button on first question
        if (prevBtn) {
            prevBtn.disabled = index === 0;
        }
        
        // Disable next button on last question
        if (nextBtn) {
            nextBtn.disabled = index === questions.length - 1;
        }
        
    } catch (error) {
        console.error('Error displaying question:', error);
    }
}

/**
 * Show the answer rationale for a question
 * @param {number} index - The index of the question
 */
function showAnswerRationale(index) {
    try {
        const questions = JSON.parse(sessionStorage.getItem('currentQuestions'));
        const question = questions[index];
        
        if (!question) {
            throw new Error(`Question at index ${index} not found`);
        }
        
        const rationaleContainer = document.getElementById('answer-rationale');
        if (!rationaleContainer) return;
        
        rationaleContainer.classList.remove('hidden');
        
        const rationaleContent = rationaleContainer.querySelector('.rationale-content');
        if (!rationaleContent) return;
        
        // Get the correct answer index or array
        const correctAnswer = question.correctAnswer;
        let correctAnswerHTML = '';
        
        // Handle single correct answer
        if (typeof correctAnswer === 'number') {
            const options = question.choices;
            const letter = String.fromCharCode(65 + correctAnswer);
            correctAnswerHTML = `<p class="mb-2"><strong>Correct Answer:</strong> ${letter}. ${options[correctAnswer]}</p>`;
        } 
        // Handle multiple correct answers (for select all that apply)
        else if (Array.isArray(correctAnswer)) {
            const options = question.choices;
            const letters = correctAnswer.map(idx => String.fromCharCode(65 + idx));
            
            correctAnswerHTML = `<p class="mb-2"><strong>Correct Answers:</strong></p><ul class="mb-3">`;
            correctAnswer.forEach(idx => {
                correctAnswerHTML += `<li>${String.fromCharCode(65 + idx)}. ${options[idx]}</li>`;
            });
            correctAnswerHTML += `</ul>`;
        }
        
        // Display rationale
        rationaleContent.innerHTML = `
            ${correctAnswerHTML}
            <p><strong>Explanation:</strong> ${question.rationale}</p>
        `;
        
    } catch (error) {
        console.error('Error showing answer rationale:', error);
    }
}

/**
 * Show the exam results
 */
function showExamResults() {
    try {
        const questions = JSON.parse(sessionStorage.getItem('currentQuestions'));
        const answers = JSON.parse(sessionStorage.getItem('examAnswers') || '{}');
        
        let correctCount = 0;
        let totalAnswered = 0;
        
        // Count correct answers
        questions.forEach((question, index) => {
            if (answers[index] !== undefined) {
                totalAnswered++;
                
                const correctAnswer = question.correctAnswer;
                if (typeof correctAnswer === 'number' && answers[index] === correctAnswer) {
                    correctCount++;
                } else if (Array.isArray(correctAnswer) && Array.isArray(answers[index])) {
                    // For multiple select questions, arrays must match exactly
                    const answerMatch = correctAnswer.length === answers[index].length && 
                        correctAnswer.every(val => answers[index].includes(val));
                    
                    if (answerMatch) correctCount++;
                }
            }
        });
        
        const score = totalAnswered ? Math.round((correctCount / totalAnswered) * 100) : 0;
        const examContainer = document.getElementById('exam-container');
        
        if (examContainer) {
            examContainer.innerHTML = `
                <div class="col-lg-10 mx-auto">
                    <div class="card">
                        <div class="card-body text-center p-5">
                            <h3 class="mb-4">Exam Results</h3>
                            <div class="display-1 fw-bold mb-3">${score}%</div>
                            <p class="lead mb-4">You answered ${correctCount} out of ${totalAnswered} questions correctly.</p>
                            <p class="mb-4">${getResultMessage(score)}</p>
                            <div class="d-flex justify-content-center gap-3">
                                <a href="practice.html" class="btn btn-secondary">Back to Exams</a>
                                <a href="practice.html?exam=${new URLSearchParams(window.location.search).get('exam')}" class="btn btn-primary">Try Again</a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error showing results:', error);
    }
}

/**
 * Get a message based on the exam score
 * @param {number} score - The exam score
 * @returns {string} - A message based on the score
 */
function getResultMessage(score) {
    if (score >= 80) {
        return "Excellent work! You're demonstrating strong nursing knowledge and clinical judgment.";
    } else if (score >= 70) {
        return "Good job! You're on the right track, but continue reviewing to strengthen your knowledge.";
    } else if (score >= 60) {
        return "You're making progress, but need more practice. Focus on understanding rationales for each question.";
    } else {
        return "Keep studying and practicing. Review core nursing concepts and clinical judgment principles.";
    }
}

/**
 * Initialize interactive examples for NGN question types
 */
function initializeNGNExamples() {
    console.log('Initializing NGN examples');
    setupNGNInteractiveExamples();
}

/**
 * Setup interactive examples for NGN question types
 */
function setupNGNInteractiveExamples() {
    setupDragAndDropExample();
    setupMatrixExample();
    setupClozeExample();
    setupHighlightingExample();
}

/**
 * Setup drag and drop example
 */
function setupDragAndDropExample() {
    // Implementation for drag and drop examples
    console.log('Setting up drag and drop example');
}

/**
 * Setup matrix example
 */
function setupMatrixExample() {
    // Implementation for matrix examples
    console.log('Setting up matrix example');
}

/**
 * Setup cloze (dropdown) example
 */
function setupClozeExample() {
    // Implementation for cloze examples
    console.log('Setting up cloze example');
}

/**
 * Setup highlighting example
 */
function setupHighlightingExample() {
    // Implementation for highlighting examples
    console.log('Setting up highlighting example');
}
