/**
 * Simulator functionality for NCLEX exam preparation
 */

// Global variables
let simulatorQuestions = [];
let userSimAnswers = [];
let currentSimQuestionIndex = 0;
let simType = 'standard';
let examTimer = null;
let examTimeRemaining = 0;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Set up the simulator buttons
    setupSimulatorButtons();
    
    // Initialize NGN examples
    initializeNGNExamples();
});

/**
 * Set up the simulator start buttons
 */
function setupSimulatorButtons() {
    // Get all simulator buttons
    const simButtons = document.querySelectorAll('[data-sim-type]');
    
    // Add click event to each button
    simButtons.forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-sim-type');
            showSimulationIntro(type);
        });
    });
    
    // Exit button
    const exitButton = document.getElementById('exit-simulator-btn');
    if (exitButton) {
        exitButton.addEventListener('click', function() {
            if (confirm('Are you sure you want to end the exam? Your progress will be saved.')) {
                endExam();
            }
        });
    }
    
    // Previous and next buttons
    const prevButton = document.getElementById('sim-prev-btn');
    const nextButton = document.getElementById('sim-next-btn');
    
    if (prevButton) {
        prevButton.addEventListener('click', function() {
            if (currentSimQuestionIndex > 0) {
                currentSimQuestionIndex--;
                loadQuestion(currentSimQuestionIndex);
            }
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            // Save current answer
            saveCurrentSimAnswer();
            
            // Go to next question or end exam if at the end
            if (currentSimQuestionIndex < simulatorQuestions.length - 1) {
                currentSimQuestionIndex++;
                loadQuestion(currentSimQuestionIndex);
            } else {
                if (confirm('You have reached the end of the exam. Do you want to submit your answers?')) {
                    endExam();
                }
            }
        });
    }
    
    // Review button
    const reviewButton = document.getElementById('sim-review-btn');
    if (reviewButton) {
        reviewButton.addEventListener('click', function() {
            const reviewContainer = document.getElementById('sim-question-review');
            if (reviewContainer.classList.contains('hidden')) {
                reviewContainer.classList.remove('hidden');
                generateSimQuestionReview();
            } else {
                reviewContainer.classList.add('hidden');
            }
        });
    }
    
    // Setup interface controls
    setupInterfaceControls();
    
    // Setup tool panels
    setupToolPanels();
}

/**
 * Show the simulation introduction screen
 * @param {string} simType - The type of simulation
 */
function showSimulationIntro(simType) {
    // Set global simulation type
    window.simType = simType;
    
    // Set exam title
    let examTitle = 'NCLEX Exam Simulator';
    let questionCount = 75;
    
    if (simType === 'standard') {
        examTitle = 'Standard NCLEX Exam';
        questionCount = 75;
    } else if (simType === 'ngn') {
        examTitle = 'Next Generation NCLEX Exam';
        questionCount = 70;
    } else if (simType === 'mini') {
        examTitle = 'NCLEX Mini Practice';
        questionCount = 10;
    }
    
    // Update the UI
    document.getElementById('sim-exam-title').textContent = examTitle;
    
    // Track exam start in analytics
    if (typeof trackExamStart === 'function') {
        trackExamStart(`simulator-${simType}`);
    }
    
    // Start the exam
    startExamSimulation();
}

/**
 * Start the exam simulation
 */
function startExamSimulation() {
    // Hide intro section and show simulator interface
    document.getElementById('simulator-intro').classList.add('hidden');
    document.getElementById('simulator-interface').classList.remove('hidden');
    
    // Load sample questions (in a real app, these would come from an API or database)
    simulatorQuestions = getSampleQuestions();
    
    // Initialize user answers array
    userSimAnswers = Array(simulatorQuestions.length).fill(null);
    
    // Create question navigation buttons
    createQuestionNavigation();
    
    // Load the first question
    loadQuestion(0);
    
    // Start the timer
    startExamTimer(window.simType);
}

/**
 * Create question navigation buttons
 */
function createQuestionNavigation() {
    const navContainer = document.getElementById('question-nav-buttons');
    if (!navContainer) return;
    
    navContainer.innerHTML = '';
    
    // Create a button for each question
    for (let i = 0; i < simulatorQuestions.length; i++) {
        const button = document.createElement('button');
        button.className = 'question-button';
        button.textContent = i + 1;
        button.dataset.index = i;
        
        // Add click event
        button.addEventListener('click', function() {
            // Save current answer
            saveCurrentSimAnswer();
            
            // Go to clicked question
            const index = parseInt(this.dataset.index);
            currentSimQuestionIndex = index;
            loadQuestion(index);
        });
        
        navContainer.appendChild(button);
    }
}

/**
 * Start the exam timer
 * @param {string} simType - The type of simulation
 */
function startExamTimer(simType) {
    // Clear any existing timer
    if (examTimer) {
        clearInterval(examTimer);
    }
    
    // Get total time in seconds
    examTimeRemaining = getTotalTime(simType);
    
    // Display initial time
    updateTimerDisplay();
    
    // Start countdown
    examTimer = setInterval(function() {
        examTimeRemaining--;
        
        // Update display
        updateTimerDisplay();
        
        // Check if time is up
        if (examTimeRemaining <= 0) {
            clearInterval(examTimer);
            alert('Time is up! Your exam will be submitted.');
            endExam();
        }
    }, 1000);
}

/**
 * Update the timer display
 */
function updateTimerDisplay() {
    const display = document.getElementById('exam-timer-display');
    if (!display) return;
    
    // Convert seconds to hours, minutes, seconds
    const hours = Math.floor(examTimeRemaining / 3600);
    const minutes = Math.floor((examTimeRemaining % 3600) / 60);
    const seconds = examTimeRemaining % 60;
    
    // Format display
    display.textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Add warning class if time is running low
    if (examTimeRemaining < 300) { // 5 minutes
        display.parentElement.style.backgroundColor = 'var(--color-quaternary)';
    }
}

/**
 * Set up interface controls
 */
function setupInterfaceControls() {
    // Set up calculator
    setupCalculator();
    
    // Set up highlighter
    const enableHighlightBtn = document.getElementById('enable-highlight-btn');
    if (enableHighlightBtn) {
        enableHighlightBtn.addEventListener('click', enableHighlighting);
    }
    
    // Set up strikethrough
    const enableStrikethroughBtn = document.getElementById('enable-strikethrough-btn');
    if (enableStrikethroughBtn) {
        enableStrikethroughBtn.addEventListener('click', enableStrikethrough);
    }
}

/**
 * Set up tool panels
 */
function setupToolPanels() {
    const toolTabs = document.querySelectorAll('.tool-tab');
    const toolPanels = document.querySelectorAll('.tool-panel');
    
    // Add click event to tabs
    toolTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tool = this.getAttribute('data-tool');
            
            // Remove active class from all tabs and panels
            toolTabs.forEach(t => t.classList.remove('active'));
            toolPanels.forEach(p => p.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding panel
            this.classList.add('active');
            document.getElementById(`${tool}-panel`).classList.add('active');
        });
    });
}

/**
 * Set up calculator functionality
 */
function setupCalculator() {
    const calculatorInput = document.getElementById('calculator-input');
    const calculatorKeys = document.querySelectorAll('.calc-key');
    
    if (!calculatorInput || !calculatorKeys.length) return;
    
    // Current values
    let currentValue = '0';
    let pendingValue = null;
    let pendingOperator = null;
    let waitingForNewValue = false;
    
    // Update display
    function updateDisplay() {
        calculatorInput.value = currentValue;
    }
    
    // Clear calculator
    function clearCalculator() {
        currentValue = '0';
        pendingValue = null;
        pendingOperator = null;
        waitingForNewValue = false;
        updateDisplay();
    }
    
    // Handle digit input
    function handleDigitInput(digit) {
        if (waitingForNewValue) {
            currentValue = digit;
            waitingForNewValue = false;
        } else {
            currentValue = currentValue === '0' ? digit : currentValue + digit;
        }
        updateDisplay();
    }
    
    // Handle decimal point
    function handleDecimalPoint() {
        if (waitingForNewValue) {
            currentValue = '0.';
            waitingForNewValue = false;
        } else if (!currentValue.includes('.')) {
            currentValue += '.';
        }
        updateDisplay();
    }
    
    // Handle operator
    function handleOperator(operator) {
        // If we have a pending calculation, calculate it first
        if (pendingOperator) {
            currentValue = calculate(pendingValue, currentValue, pendingOperator);
            updateDisplay();
        }
        
        // Save the current value and operator
        pendingValue = currentValue;
        pendingOperator = operator;
        waitingForNewValue = true;
    }
    
    // Handle equals
    function handleEquals() {
        if (pendingOperator) {
            currentValue = calculate(pendingValue, currentValue, pendingOperator);
            pendingValue = null;
            pendingOperator = null;
            waitingForNewValue = true;
            updateDisplay();
        }
    }
    
    // Handle backspace
    function handleBackspace() {
        if (currentValue.length > 1) {
            currentValue = currentValue.slice(0, -1);
        } else {
            currentValue = '0';
        }
        updateDisplay();
    }
    
    // Handle percent
    function handlePercent() {
        currentValue = (parseFloat(currentValue) / 100).toString();
        updateDisplay();
    }
    
    // Add click events to calculator keys
    calculatorKeys.forEach(key => {
        key.addEventListener('click', function() {
            const keyValue = this.getAttribute('data-key');
            
            switch (keyValue) {
                case 'clear':
                    clearCalculator();
                    break;
                case 'backspace':
                    handleBackspace();
                    break;
                case 'percent':
                    handlePercent();
                    break;
                case 'divide':
                case 'multiply':
                case 'subtract':
                case 'add':
                    handleOperator(keyValue);
                    break;
                case 'equals':
                    handleEquals();
                    break;
                case 'decimal':
                    handleDecimalPoint();
                    break;
                default: // Digits 0-9
                    handleDigitInput(keyValue);
                    break;
            }
        });
    });
    
    // Initialize calculator
    clearCalculator();
}

/**
 * Calculate result based on operator
 * @param {string} a - First value
 * @param {string} b - Second value
 * @param {string} op - Operator
 * @returns {string} - Result
 */
function calculate(a, b, op) {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    let result = 0;
    
    switch (op) {
        case 'add':
            result = numA + numB;
            break;
        case 'subtract':
            result = numA - numB;
            break;
        case 'multiply':
            result = numA * numB;
            break;
        case 'divide':
            if (numB !== 0) {
                result = numA / numB;
            } else {
                return 'Error';
            }
            break;
    }
    
    // Format result
    return result.toString().includes('.') ? result.toFixed(8).replace(/\.?0+$/, '') : result.toString();
}

/**
 * Enable highlighting mode
 */
function enableHighlighting() {
    // Get elements
    const enableBtn = document.getElementById('enable-highlight-btn');
    const questionStem = document.getElementById('sim-question-stem');
    
    if (!enableBtn || !questionStem) return;
    
    // Toggle button text and highlighting mode
    if (enableBtn.textContent === 'Enable Highlighting') {
        enableBtn.textContent = 'Disable Highlighting';
        enableBtn.classList.add('primary');
        
        // Add highlighting event listener
        questionStem.addEventListener('mouseup', highlightSelection);
    } else {
        enableBtn.textContent = 'Enable Highlighting';
        enableBtn.classList.remove('primary');
        
        // Remove highlighting event listener
        questionStem.removeEventListener('mouseup', highlightSelection);
    }
}

/**
 * Disable highlighting mode
 */
function disableHighlighting() {
    const enableBtn = document.getElementById('enable-highlight-btn');
    if (enableBtn) {
        enableBtn.textContent = 'Enable Highlighting';
        enableBtn.classList.remove('primary');
    }
    
    const questionStem = document.getElementById('sim-question-stem');
    if (questionStem) {
        questionStem.removeEventListener('mouseup', highlightSelection);
    }
}

/**
 * Highlight selected text
 */
function highlightSelection() {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
        // Create a span to wrap the selected text
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();
        
        // Check if the selection is already highlighted
        if (range.startContainer.parentNode.classList && 
            range.startContainer.parentNode.classList.contains('highlight-active')) {
            // Remove highlight
            const highlightSpan = range.startContainer.parentNode;
            const textNode = document.createTextNode(highlightSpan.textContent);
            highlightSpan.parentNode.replaceChild(textNode, highlightSpan);
        } else {
            // Add highlight
            const span = document.createElement('span');
            span.classList.add('highlight-active');
            span.textContent = selectedText;
            range.deleteContents();
            range.insertNode(span);
        }
        
        // Clear selection
        selection.removeAllRanges();
    }
}

/**
 * Enable strikethrough mode
 */
function enableStrikethrough() {
    // Get elements
    const enableBtn = document.getElementById('enable-strikethrough-btn');
    const options = document.querySelectorAll('#sim-options-container .option');
    
    if (!enableBtn || !options.length) return;
    
    // Toggle button text and strikethrough mode
    if (enableBtn.textContent === 'Enable Strikethrough') {
        enableBtn.textContent = 'Disable Strikethrough';
        enableBtn.classList.add('primary');
        
        // Add strikethrough event listener to options
        options.forEach(option => {
            option.addEventListener('click', toggleStrikethrough);
        });
    } else {
        enableBtn.textContent = 'Enable Strikethrough';
        enableBtn.classList.remove('primary');
        
        // Remove strikethrough event listener from options
        options.forEach(option => {
            option.removeEventListener('click', toggleStrikethrough);
        });
    }
}

/**
 * Disable strikethrough mode
 */
function disableStrikethrough() {
    const enableBtn = document.getElementById('enable-strikethrough-btn');
    if (enableBtn) {
        enableBtn.textContent = 'Enable Strikethrough';
        enableBtn.classList.remove('primary');
    }
    
    const options = document.querySelectorAll('#sim-options-container .option');
    if (options.length) {
        options.forEach(option => {
            option.removeEventListener('click', toggleStrikethrough);
        });
    }
}

/**
 * Toggle strikethrough on an option
 */
function toggleStrikethrough() {
    this.style.textDecoration = this.style.textDecoration === 'line-through' ? 'none' : 'line-through';
}

/**
 * Load a question
 * @param {number} questionNumber - The question number to load
 */
function loadQuestion(questionNumber) {
    // Update current question index
    currentSimQuestionIndex = questionNumber;
    
    // Get the question
    const question = simulatorQuestions[questionNumber];
    
    // Update question number and navigation buttons
    document.getElementById('sim-prev-btn').disabled = questionNumber === 0;
    document.getElementById('sim-next-btn').textContent = questionNumber === simulatorQuestions.length - 1 ? 'Submit Exam' : 'Next';
    
    // Update question navigation highlights
    const questionButtons = document.querySelectorAll('.question-button');
    questionButtons.forEach(button => {
        button.classList.remove('current');
        const buttonIndex = parseInt(button.dataset.index);
        
        // Mark as current if this is the current question
        if (buttonIndex === questionNumber) {
            button.classList.add('current');
        }
        
        // Mark as answered if the user has answered this question
        if (userSimAnswers[buttonIndex] !== null) {
            button.classList.add('answered');
        } else {
            button.classList.remove('answered');
        }
    });
    
    // Update question stem
    document.getElementById('sim-question-stem').textContent = question.stem;
    
    // Clear options container
    const optionsContainer = document.getElementById('sim-options-container');
    optionsContainer.innerHTML = '';
    
    // Determine question type (single-select or multi-select)
    const isMultiSelect = question.questionType === 'multi-select';
    
    // Add options
    if (question.options) {
        // If this is a multi-select question, add a note
        if (isMultiSelect) {
            const noteElement = document.createElement('div');
            noteElement.className = 'mt-3 mb-3';
            noteElement.innerHTML = '<strong>Note:</strong> This is a multi-select question. Select all options that apply.';
            optionsContainer.appendChild(noteElement);
        }
        
        // Add options
        question.options.forEach((option, optionIndex) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'option';
            optionElement.dataset.index = optionIndex;
            
            // Check if this option was previously selected
            const userAnswer = userSimAnswers[questionNumber];
            if (userAnswer !== null) {
                if (isMultiSelect && Array.isArray(userAnswer)) {
                    if (userAnswer.includes(optionIndex)) {
                        optionElement.classList.add('selected');
                    }
                } else if (userAnswer === optionIndex) {
                    optionElement.classList.add('selected');
                }
            }
            
            // Create option marker (A, B, C, etc.)
            const markerElement = document.createElement('div');
            markerElement.className = 'option-marker';
            markerElement.textContent = String.fromCharCode(65 + optionIndex); // A, B, C, etc.
            
            // Create option text
            const textElement = document.createElement('div');
            textElement.className = 'option-text';
            textElement.textContent = option;
            
            // Add elements to option
            optionElement.appendChild(markerElement);
            optionElement.appendChild(textElement);
            
            // Add click event listener
            optionElement.addEventListener('click', function(e) {
                // Don't select if in strikethrough mode
                const strikethroughBtn = document.getElementById('enable-strikethrough-btn');
                if (strikethroughBtn && strikethroughBtn.textContent === 'Disable Strikethrough') {
                    return; // Let the strikethrough handler handle it
                }
                
                if (isMultiSelect) {
                    // For multi-select, toggle selection
                    this.classList.toggle('selected');
                } else {
                    // For single-select, remove selection from all options and select this one
                    document.querySelectorAll('#sim-options-container .option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    this.classList.add('selected');
                }
                
                // Mark the question as answered in the navigation
                const questionButton = document.querySelector(`.question-button[data-index="${questionNumber}"]`);
                if (questionButton) {
                    questionButton.classList.add('answered');
                }
            });
            
            // Add to options container
            optionsContainer.appendChild(optionElement);
        });
    }
    
    // Reset tool states
    disableHighlighting();
    disableStrikethrough();
}

/**
 * Save the user's answer for the current question
 */
function saveCurrentSimAnswer() {
    const selectedOptions = document.querySelectorAll('#sim-options-container .option.selected');
    const question = simulatorQuestions[currentSimQuestionIndex];
    const isMultiSelect = question.questionType === 'multi-select';
    
    if (selectedOptions.length > 0) {
        if (isMultiSelect) {
            // For multi-select, save an array of selected indices
            userSimAnswers[currentSimQuestionIndex] = Array.from(selectedOptions).map(opt => 
                parseInt(opt.dataset.index)
            );
        } else {
            // For single-select, save the index of the selected option
            userSimAnswers[currentSimQuestionIndex] = parseInt(selectedOptions[0].dataset.index);
        }
    }
}

/**
 * Get sample questions for demo
 * @returns {Array} - Array of sample questions
 */
function getSampleQuestions() {
    // In a real application, these would be loaded from an API or database
    // For the simulator demo, we'll generate more questions for full simulation
    let questionsArray = [
        {
            stem: "A nurse is caring for a client with hypertension who takes enalapril 10 mg orally daily. The client's blood pressure today is 90/50 mmHg. The client reports feeling dizzy when standing. What is the priority nursing action?",
            options: [
                "Administer the enalapril as prescribed",
                "Hold the enalapril and notify the healthcare provider",
                "Have the client lie down and recheck blood pressure in 30 minutes",
                "Give the client a glass of water and recheck blood pressure"
            ],
            answer: 1,
            rationale: "The client is experiencing hypotension (90/50 mmHg) and orthostatic symptoms, which are side effects of enalapril. The priority action is to hold the medication and notify the healthcare provider for further orders."
        },
        {
            stem: "A nurse is caring for a client who has just returned from surgery with a nasogastric tube connected to low intermittent suction. Which finding requires immediate intervention?",
            options: [
                "Small amount of bright red drainage in the collection chamber",
                "Gurgling sounds when air is injected into the tube",
                "Absence of bowel sounds in all four quadrants",
                "pH of 7 when drainage is tested with pH paper"
            ],
            answer: 0,
            rationale: "Bright red drainage in the collection chamber indicates fresh bleeding, which requires immediate intervention. This could indicate trauma to the nasogastric tube insertion site or other gastrointestinal bleeding."
        },
        {
            stem: "A client with pneumonia has an order for ceftriaxone 1 g IV every 24 hours. The medication label states that when reconstituted with 10 mL of sterile water, the resulting concentration is 100 mg/mL. How many milliliters should the nurse administer?",
            options: [
                "1 mL",
                "10 mL",
                "100 mL",
                "None of the above"
            ],
            answer: 1,
            rationale: "To calculate the volume: Desired dose = 1 g = 1000 mg. Concentration = 100 mg/mL. Volume = Desired dose ÷ Concentration = 1000 mg ÷ 100 mg/mL = 10 mL."
        },
        {
            questionType: "multi-select",
            stem: "A nurse is providing discharge teaching to a client who has been prescribed warfarin. Select all the instructions that should be included in the teaching.",
            options: [
                "Report unusual bleeding or bruising to your healthcare provider",
                "Take aspirin for headaches",
                "Eat a consistent amount of green leafy vegetables",
                "Have regular blood tests to monitor INR levels",
                "Avoid contact sports",
                "Increase your vitamin K intake"
            ],
            answer: [0, 2, 3, 4],
            rationale: "The correct instructions for a client on warfarin include reporting unusual bleeding, maintaining consistent vitamin K intake (from green leafy vegetables), having regular INR monitoring, and avoiding activities with high risk of injury. The client should avoid aspirin (increases bleeding risk) and should not increase vitamin K (antagonizes warfarin)."
        },
        {
            stem: "A nurse is caring for a client who has been newly diagnosed with type 1 diabetes mellitus. Which statement by the client indicates a need for further teaching?",
            options: [
                "I should rotate my insulin injection sites",
                "I can stop taking insulin once my blood sugar normalizes",
                "I need to check my feet daily for cuts or sores",
                "I should carry a source of fast-acting glucose with me"
            ],
            answer: 1,
            rationale: "The statement 'I can stop taking insulin once my blood sugar normalizes' indicates a need for further teaching. Clients with type 1 diabetes require lifelong insulin therapy because their pancreas does not produce insulin."
        }
    ];
    
    // For full simulation, we need to generate more questions
    // Duplicate and slightly modify existing questions to get to 100 questions
    if (window.simType === 'standard' || window.simType === 'ngn') {
        // Store original questions for reference
        const originalQuestions = [...questionsArray];
        
        // We need to generate up to 100 questions
        while (questionsArray.length < 100) {
            // Take a question from the original set and clone it
            const randomIndex = Math.floor(Math.random() * originalQuestions.length);
            const originalQuestion = originalQuestions[randomIndex];
            
            // Clone and modify the question slightly to make it appear different
            const clonedQuestion = JSON.parse(JSON.stringify(originalQuestion));
            
            // Add a variation identifier to make it appear different
            const variationNum = Math.floor(questionsArray.length / originalQuestions.length) + 1;
            clonedQuestion.stem = clonedQuestion.stem.replace(/\?$/, ` (Variation ${variationNum})?`);
            
            // Add the modified question to our questions array
            questionsArray.push(clonedQuestion);
        }
    }
    
    return questionsArray;
}

/**
 * End the exam
 */
function endExam() {
    // Save current answer
    saveCurrentSimAnswer();
    
    // Stop the timer
    if (examTimer) {
        clearInterval(examTimer);
    }
    
    // Hide simulator interface and show results
    document.getElementById('simulator-interface').classList.add('hidden');
    document.getElementById('simulator-results').classList.remove('hidden');
    
    // Display results
    showResults();
}

/**
 * Show exam results
 */
function showResults() {
    // Calculate the score
    let correctCount = 0;
    
    for (let i = 0; i < simulatorQuestions.length; i++) {
        const question = simulatorQuestions[i];
        const userAnswer = userSimAnswers[i];
        const correctAnswer = question.answer;
        
        // Skip if user didn't answer
        if (userAnswer === null) continue;
        
        // Check if answer is correct
        if (Array.isArray(correctAnswer)) {
            // For multi-select questions
            if (Array.isArray(userAnswer) && 
                userAnswer.length === correctAnswer.length && 
                userAnswer.every(ans => correctAnswer.includes(ans))) {
                correctCount++;
            }
        } else {
            // For single-select questions
            if (userAnswer === correctAnswer) {
                correctCount++;
            }
        }
    }
    
    // Calculate score percentage
    const totalQuestions = simulatorQuestions.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    
    // Calculate time taken
    const totalTime = getTotalTime(window.simType);
    const timeTaken = totalTime - examTimeRemaining;
    const hours = Math.floor(timeTaken / 3600);
    const minutes = Math.floor((timeTaken % 3600) / 60);
    const seconds = timeTaken % 60;
    const timeDisplay = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Update results UI
    document.getElementById('sim-result-score').textContent = `${scorePercentage}%`;
    document.getElementById('sim-result-correct').textContent = correctCount;
    document.getElementById('sim-result-total').textContent = totalQuestions;
    document.getElementById('sim-result-time').textContent = timeDisplay;
    document.getElementById('sim-result-message').textContent = getResultMessage(scorePercentage);
    
    // Create performance analysis
    createPerformanceAnalysis(correctCount, totalQuestions);
    
    // Track exam completion in analytics
    if (typeof trackExamCompletion === 'function') {
        trackExamCompletion(`simulator-${window.simType}`, scorePercentage);
    }
}

/**
 * Create performance analysis
 * @param {number} correctCount - Number of correct answers
 * @param {number} totalQuestions - Total number of questions
 */
function createPerformanceAnalysis(correctCount, totalQuestions) {
    const analysisContainer = document.getElementById('analysis-container');
    if (!analysisContainer) return;
    
    // Calculate percentage
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    
    // Create analysis HTML
    let html = `
        <div class="neu-card">
            <h4>Score Breakdown</h4>
            <p>You answered ${correctCount} out of ${totalQuestions} questions correctly.</p>
            <div class="progress-bar">
                <div class="progress" style="width: ${percentage}%"></div>
            </div>
            <p class="mt-2">Your score: ${percentage}%</p>
        </div>
    `;
    
    // Add recommendations based on score
    html += `
        <div class="neu-card mt-4">
            <h4>Recommendations</h4>
            <ul class="exam-features">
    `;
    
    if (percentage < 60) {
        html += `
            <li><i class="fas fa-check"></i> Focus on content review in key areas</li>
            <li><i class="fas fa-check"></i> Practice more questions daily</li>
            <li><i class="fas fa-check"></i> Consider using additional study resources</li>
            <li><i class="fas fa-check"></i> Form a study group for support</li>
            <li><i class="fas fa-check"></i> Schedule regular review sessions</li>
        `;
    } else if (percentage < 80) {
        html += `
            <li><i class="fas fa-check"></i> Review rationales for missed questions</li>
            <li><i class="fas fa-check"></i> Focus on test-taking strategies</li>
            <li><i class="fas fa-check"></i> Continue daily practice with timed sessions</li>
            <li><i class="fas fa-check"></i> Identify and strengthen weak content areas</li>
            <li><i class="fas fa-check"></i> Take another practice exam in one week</li>
        `;
    } else {
        html += `
            <li><i class="fas fa-check"></i> Maintain your excellent study habits</li>
            <li><i class="fas fa-check"></i> Focus on any remaining weak areas</li>
            <li><i class="fas fa-check"></i> Practice more complex question types</li>
            <li><i class="fas fa-check"></i> Begin final exam preparation</li>
            <li><i class="fas fa-check"></i> You're ready for the NCLEX exam!</li>
        `;
    }
    
    html += `
            </ul>
        </div>
    `;
    
    // Set container HTML
    analysisContainer.innerHTML = html;
}

/**
 * Generate the question review section
 */
function generateSimQuestionReview() {
    const reviewContainer = document.getElementById('sim-review-questions');
    if (!reviewContainer) return;
    
    reviewContainer.innerHTML = '';
    
    simulatorQuestions.forEach((question, index) => {
        const questionReview = document.createElement('div');
        questionReview.className = 'question-container mt-4';
        
        // Question header
        const questionHeader = document.createElement('div');
        questionHeader.innerHTML = `<h4>Question ${index + 1}</h4>`;
        
        // Question stem
        const questionStem = document.createElement('p');
        questionStem.className = 'question-stem';
        questionStem.textContent = question.stem;
        
        // Options
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-container';
        
        // Add options
        if (question.options) {
            question.options.forEach((option, optionIndex) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'option';
                
                // Check if this is the correct answer
                if (Array.isArray(question.answer)) {
                    if (question.answer.includes(optionIndex)) {
                        optionElement.classList.add('correct');
                    }
                } else if (question.answer === optionIndex) {
                    optionElement.classList.add('correct');
                }
                
                // Check if user selected this option
                const userAnswer = userSimAnswers[index];
                if (userAnswer !== null) {
                    if (Array.isArray(userAnswer) && userAnswer.includes(optionIndex)) {
                        optionElement.classList.add('selected');
                    } else if (userAnswer === optionIndex) {
                        optionElement.classList.add('selected');
                    }
                }
                
                // Create option marker
                const markerElement = document.createElement('div');
                markerElement.className = 'option-marker';
                markerElement.textContent = String.fromCharCode(65 + optionIndex); // A, B, C, etc.
                
                // Create option text
                const textElement = document.createElement('div');
                textElement.className = 'option-text';
                textElement.textContent = option;
                
                // Add elements to option
                optionElement.appendChild(markerElement);
                optionElement.appendChild(textElement);
                
                // Add to options container
                optionsContainer.appendChild(optionElement);
            });
        }
        
        // Rationale
        const rationaleContainer = document.createElement('div');
        rationaleContainer.className = 'answer-rationale';
        rationaleContainer.innerHTML = `
            <h3>Rationale</h3>
            <p>${question.rationale || "No rationale available for this question."}</p>
        `;
        
        // Build the question review
        questionReview.appendChild(questionHeader);
        questionReview.appendChild(questionStem);
        questionReview.appendChild(optionsContainer);
        questionReview.appendChild(rationaleContainer);
        
        // Add to review container
        reviewContainer.appendChild(questionReview);
    });
}

/**
 * Get total exam time in seconds based on simulation type
 * @param {string} simType - The type of simulation
 * @returns {number} - Total time in seconds
 */
function getTotalTime(simType) {
    switch (simType) {
        case 'standard':
            return 5 * 60 * 60; // 5 hours
        case 'ngn':
            return 5 * 60 * 60; // 5 hours
        case 'mini':
            return 30 * 60; // 30 minutes
        default:
            return 60 * 60; // 1 hour default
    }
}
