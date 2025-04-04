/**
 * NCLEX Simulator Functionality
 */

// Store questions globally
let simulatorQuestions = [];
let currentSimType = '';

document.addEventListener('DOMContentLoaded', function() {
    // Load questions from our database
    fetch('../data/nclex-questions.json')
        .then(response => response.json())
        .then(data => {
            simulatorQuestions = data.questions;
            console.log('Questions loaded:', simulatorQuestions.length);
        })
        .catch(error => {
            console.error('Error loading questions:', error);
        });

    // Set up simulator start buttons
    setupSimulatorButtons();
    
    // Set up interface controls
    setupInterfaceControls();
    
    // Set up tool panels
    setupToolPanels();
    
    // Initialize NGN examples
    initializeNGNExamples();
});

/**
 * Set up the simulator start buttons
 */
function setupSimulatorButtons() {
    const startButtons = document.querySelectorAll('.start-sim');
    
    startButtons.forEach(button => {
        button.addEventListener('click', function() {
            const simType = this.getAttribute('data-sim');
            currentSimType = simType;
            showSimulationIntro(simType);
        });
    });
    
    // Set up begin exam button
    const beginButton = document.querySelector('.begin-exam');
    if (beginButton) {
        beginButton.addEventListener('click', function() {
            document.getElementById('simulation-intro').classList.add('hidden');
            startExamSimulation();
        });
    }
}

/**
 * Show the simulation introduction screen
 * @param {string} simType - The type of simulation
 */
function showSimulationIntro(simType) {
    const introScreen = document.getElementById('simulation-intro');
    const examTypeEl = document.getElementById('intro-exam-type');
    const timeEl = document.getElementById('intro-time');
    const questionsEl = document.getElementById('intro-questions');
    
    // Set the content based on sim type
    switch(simType) {
        case 'rn-75':
            examTypeEl.textContent = 'NCLEX-RN Simulation';
            timeEl.textContent = '2 hours (120 minutes)';
            questionsEl.textContent = '75 questions';
            break;
        case 'ngn-full':
            examTypeEl.textContent = 'Next Generation NCLEX Simulation';
            timeEl.textContent = '5 hours (300 minutes)';
            questionsEl.textContent = '135 questions (including case studies)';
            break;
        case 'practice-30':
            examTypeEl.textContent = 'Practice Mode';
            timeEl.textContent = '30 minutes';
            questionsEl.textContent = '25 questions';
            break;
    }
    
    // Store simulation type for later use
    localStorage.setItem('currentSimType', simType);
    
    // Show the intro screen
    introScreen.classList.remove('hidden');
}

/**
 * Start the exam simulation
 */
function startExamSimulation() {
    const simulatorInterface = document.getElementById('simulator-interface');
    simulatorInterface.classList.remove('hidden');
    
    // Get simulation type
    const simType = localStorage.getItem('currentSimType') || 'practice-30';
    
    // Set exam name in header
    const examNameEl = document.getElementById('exam-name');
    switch(simType) {
        case 'rn-75':
            examNameEl.textContent = 'NCLEX-RN® Examination';
            break;
        case 'ngn-full':
            examNameEl.textContent = 'Next Generation NCLEX® Examination';
            break;
        case 'practice-30':
            examNameEl.textContent = 'NCLEX Practice Mode';
            break;
    }
    
    // Set total questions
    const totalQuestionsEl = document.getElementById('total-questions');
    switch(simType) {
        case 'rn-75':
            totalQuestionsEl.textContent = '75';
            break;
        case 'ngn-full':
            totalQuestionsEl.textContent = '135';
            break;
        case 'practice-30':
            totalQuestionsEl.textContent = '25';
            break;
    }
    
    // Start the timer
    startExamTimer(simType);
    
    // Load first question
    loadQuestion(1);
}

/**
 * Start the exam timer
 * @param {string} simType - The type of simulation
 */
function startExamTimer(simType) {
    let totalSeconds;
    
    switch(simType) {
        case 'rn-75':
            totalSeconds = 120 * 60; // 2 hours
            break;
        case 'ngn-full':
            totalSeconds = 300 * 60; // 5 hours
            break;
        case 'practice-30':
            totalSeconds = 30 * 60; // 30 minutes
            break;
        default:
            totalSeconds = 120 * 60; // Default to 2 hours
    }
    
    const timerEl = document.getElementById('exam-timer');
    
    // Store end time
    const endTime = Date.now() + (totalSeconds * 1000);
    localStorage.setItem('examEndTime', endTime);
    
    // Update timer every second
    window.examTimerInterval = setInterval(function() {
        const currentTime = Date.now();
        const timeRemaining = Math.max(0, Math.floor((endTime - currentTime) / 1000));
        
        if (timeRemaining <= 0) {
            clearInterval(window.examTimerInterval);
            endExam();
        }
        
        // Format time
        const hours = Math.floor(timeRemaining / 3600);
        const minutes = Math.floor((timeRemaining % 3600) / 60);
        const seconds = timeRemaining % 60;
        
        timerEl.textContent = 
            (hours < 10 ? '0' + hours : hours) + ':' +
            (minutes < 10 ? '0' + minutes : minutes) + ':' +
            (seconds < 10 ? '0' + seconds : seconds);
    }, 1000);
}

/**
 * Set up interface controls
 */
function setupInterfaceControls() {
    // Pause button
    const pauseButton = document.getElementById('pause-exam');
    if (pauseButton) {
        pauseButton.addEventListener('click', function() {
            document.getElementById('pause-screen').classList.remove('hidden');
        });
    }
    
    // Resume button
    const resumeButton = document.querySelector('.resume-exam');
    if (resumeButton) {
        resumeButton.addEventListener('click', function() {
            document.getElementById('pause-screen').classList.add('hidden');
        });
    }
    
    // End exam button
    const endButton = document.getElementById('end-exam');
    if (endButton) {
        endButton.addEventListener('click', function() {
            document.getElementById('end-confirmation').classList.remove('hidden');
        });
    }
    
    // Cancel end button
    const cancelEndButton = document.querySelector('.cancel-end');
    if (cancelEndButton) {
        cancelEndButton.addEventListener('click', function() {
            document.getElementById('end-confirmation').classList.add('hidden');
        });
    }
    
    // Confirm end button
    const confirmEndButton = document.querySelector('.confirm-end');
    if (confirmEndButton) {
        confirmEndButton.addEventListener('click', function() {
            document.getElementById('end-confirmation').classList.add('hidden');
            endExam();
        });
    }
    
    // Navigation buttons
    const prevButton = document.getElementById('previous-btn');
    const nextButton = document.getElementById('next-btn');
    
    if (prevButton) {
        prevButton.addEventListener('click', function() {
            if (this.disabled) return;
            
            const currentQuestion = parseInt(document.getElementById('current-question').textContent);
            if (currentQuestion > 1) {
                loadQuestion(currentQuestion - 1);
            }
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            const currentQuestion = parseInt(document.getElementById('current-question').textContent);
            const totalQuestions = parseInt(document.getElementById('total-questions').textContent);
            
            if (currentQuestion < totalQuestions) {
                loadQuestion(currentQuestion + 1);
            } else {
                // If at last question, end exam
                document.getElementById('end-confirmation').classList.remove('hidden');
            }
        });
    }
    
    // Results screen buttons
    const reviewButton = document.querySelector('.review-exam');
    if (reviewButton) {
        reviewButton.addEventListener('click', function() {
            document.getElementById('results-screen').classList.add('hidden');
            document.getElementById('simulator-interface').classList.remove('hidden');
        });
    }
    
    const exitResultsButton = document.querySelector('.exit-results');
    if (exitResultsButton) {
        exitResultsButton.addEventListener('click', function() {
            document.getElementById('results-screen').classList.add('hidden');
            document.getElementById('simulator-interface').classList.add('hidden');
            window.location.href = 'simulator.html';
        });
    }
}

/**
 * Set up tool panels
 */
function setupToolPanels() {
    // Calculator button
    const calculatorBtn = document.getElementById('calculator-btn');
    if (calculatorBtn) {
        calculatorBtn.addEventListener('click', function() {
            const calculatorPanel = document.getElementById('calculator-panel');
            calculatorPanel.classList.toggle('hidden');
            
            // Setup calculator if visible
            if (!calculatorPanel.classList.contains('hidden')) {
                setupCalculator();
            }
        });
    }
    
    // Notes button
    const notesBtn = document.getElementById('notes-btn');
    if (notesBtn) {
        notesBtn.addEventListener('click', function() {
            const notesPanel = document.getElementById('notes-panel');
            notesPanel.classList.toggle('hidden');
        });
    }
    
    // Highlight button
    const highlightBtn = document.getElementById('highlight-btn');
    if (highlightBtn) {
        highlightBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            
            if (this.classList.contains('active')) {
                // Enable highlighting mode
                enableHighlighting();
            } else {
                // Disable highlighting mode
                disableHighlighting();
            }
        });
    }
    
    // Strikethrough button
    const strikethroughBtn = document.getElementById('strikethrough-btn');
    if (strikethroughBtn) {
        strikethroughBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            
            if (this.classList.contains('active')) {
                // Enable strikethrough mode
                enableStrikethrough();
            } else {
                // Disable strikethrough mode
                disableStrikethrough();
            }
        });
    }
    
    // Close panel buttons
    const closePanelButtons = document.querySelectorAll('.close-panel');
    closePanelButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.tool-panel').classList.add('hidden');
        });
    });
}

/**
 * Set up calculator functionality
 */
function setupCalculator() {
    const display = document.getElementById('calc-display');
    const buttons = document.querySelectorAll('.calc-btn');
    
    let currentValue = '';
    let operator = '';
    let previousValue = '';
    
    // Clear display
    display.value = '0';
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const value = this.textContent;
            
            if (value >= '0' && value <= '9' || value === '.') {
                if (currentValue === '0' && value !== '.') {
                    currentValue = value;
                } else {
                    // Only allow one decimal point
                    if (value === '.' && currentValue.includes('.')) {
                        return;
                    }
                    currentValue += value;
                }
                display.value = currentValue;
            } else if (value === 'C') {
                // Clear all
                currentValue = '0';
                operator = '';
                previousValue = '';
                display.value = currentValue;
            } else if (value === 'CE') {
                // Clear entry
                currentValue = '0';
                display.value = currentValue;
            } else if (value === '+' || value === '-' || value === '*' || value === '/') {
                // Operator
                if (currentValue === '') return;
                
                if (previousValue !== '') {
                    // Calculate previous operation
                    currentValue = calculate(previousValue, currentValue, operator);
                    display.value = currentValue;
                }
                
                operator = value;
                previousValue = currentValue;
                currentValue = '';
            } else if (value === '=') {
                // Calculate result
                if (previousValue === '' || currentValue === '') return;
                
                currentValue = calculate(previousValue, currentValue, operator);
                display.value = currentValue;
                
                // Reset for next calculation
                previousValue = '';
                operator = '';
            }
        });
    });
}

/**
 * Calculate result based on operator
 * @param {string} a - First value
 * @param {string} b - Second value
 * @param {string} op - Operator
 * @returns {string} - Result
 */
function calculate(a, b, op) {
    a = parseFloat(a);
    b = parseFloat(b);
    
    switch (op) {
        case '+':
            return (a + b).toString();
        case '-':
            return (a - b).toString();
        case '*':
            return (a * b).toString();
        case '/':
            return (b === 0) ? 'Error' : (a / b).toString();
        default:
            return b.toString();
    }
}

/**
 * Enable highlighting mode
 */
function enableHighlighting() {
    // Implementation would depend on the question content
    const questionContent = document.querySelector('.question-content');
    
    questionContent.style.cursor = 'pointer';
    questionContent.addEventListener('mouseup', highlightSelection);
}

/**
 * Disable highlighting mode
 */
function disableHighlighting() {
    const questionContent = document.querySelector('.question-content');
    
    questionContent.style.cursor = '';
    questionContent.removeEventListener('mouseup', highlightSelection);
}

/**
 * Highlight selected text
 */
function highlightSelection() {
    const selection = window.getSelection();
    
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        if (range.toString().trim() !== '') {
            const span = document.createElement('span');
            span.style.backgroundColor = 'yellow';
            span.className = 'highlighted-text';
            
            try {
                range.surroundContents(span);
            } catch (e) {
                console.error('Error highlighting text:', e);
            }
            
            selection.removeAllRanges();
        }
    }
}

/**
 * Enable strikethrough mode
 */
function enableStrikethrough() {
    // Add click event to options
    const options = document.querySelectorAll('.option');
    
    options.forEach(option => {
        option.addEventListener('click', toggleStrikethrough);
    });
}

/**
 * Disable strikethrough mode
 */
function disableStrikethrough() {
    const options = document.querySelectorAll('.option');
    
    options.forEach(option => {
        option.removeEventListener('click', toggleStrikethrough);
    });
}

/**
 * Toggle strikethrough on an option
 */
function toggleStrikethrough() {
    this.classList.toggle('strikethrough');
}

/**
 * Load a question
 * @param {number} questionNumber - The question number to load
 */
function loadQuestion(questionNumber) {
    // Update current question display
    const currentQuestionEl = document.getElementById('current-question');
    currentQuestionEl.textContent = questionNumber;
    
    // Update previous button state
    const prevButton = document.getElementById('previous-btn');
    prevButton.disabled = questionNumber === 1;
    
    // Load question content
    const questionStem = document.getElementById('question-stem');
    const questionOptions = document.getElementById('question-options');
    
    // Get the question from our database or use sample questions if not loaded yet
    let question;
    if (simulatorQuestions && simulatorQuestions.length > 0) {
        question = simulatorQuestions[(questionNumber - 1) % simulatorQuestions.length];
    } else {
        // Fallback to sample questions
        const sampleQuestions = getSampleQuestions();
        question = sampleQuestions[(questionNumber - 1) % sampleQuestions.length];
    }
    
    // Set question stem
    questionStem.innerHTML = question.stem;
    
    // Set options
    questionOptions.innerHTML = '';
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.innerHTML = `
            <div class="option-marker">${String.fromCharCode(65 + index)}</div>
            <div class="option-text">${option}</div>
        `;
        
        // Add click handler for option selection
        optionElement.addEventListener('click', function() {
            // If strikethrough mode is active, don't select
            if (document.getElementById('strikethrough-btn').classList.contains('active')) {
                return;
            }
            
            // Deselect all options
            document.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Select this option
            this.classList.add('selected');
            
            // Store answer
            const answers = JSON.parse(localStorage.getItem('examAnswers') || '{}');
            answers[questionNumber] = index;
            localStorage.setItem('examAnswers', JSON.stringify(answers));
        });
        
        questionOptions.appendChild(optionElement);
    });
    
    // Check if there's a stored answer for this question
    const answers = JSON.parse(localStorage.getItem('examAnswers') || '{}');
    if (answers[questionNumber] !== undefined) {
        const options = document.querySelectorAll('.option');
        if (options.length > answers[questionNumber]) {
            options[answers[questionNumber]].classList.add('selected');
        }
    }
}

/**
 * Get sample questions for demo
 * @returns {Array} - Array of sample questions
 */
function getSampleQuestions() {
    return [
        {
            stem: "A nurse is caring for a client with heart failure who is receiving furosemide (Lasix) 40 mg IV. The client's serum potassium level is 3.2 mEq/L. Which action should the nurse take?",
            options: [
                "Administer the medication as ordered",
                "Hold the medication and notify the healthcare provider",
                "Administer the medication with a banana",
                "Request an order for potassium supplementation before administering the medication"
            ]
        },
        {
            stem: "A nurse is caring for a client who had abdominal surgery 2 days ago. The client reports pain at the incision site rated as 8/10. The last dose of morphine sulfate 4 mg IV was given 5 hours ago. The medication is ordered every 4 hours as needed. Which action should the nurse take?",
            options: [
                "Encourage the client to wait 1 more hour before receiving pain medication",
                "Administer the ordered dose of morphine sulfate",
                "Contact the healthcare provider to increase the dosage",
                "Assess the client's vital signs before administering the medication"
            ]
        },
        {
            stem: "A nurse is caring for a client who has just been diagnosed with type 1 diabetes mellitus. Which statement by the client indicates effective teaching about insulin administration?",
            options: [
                "\"I should always inject my insulin in the same site to ensure consistent absorption.\"",
                "\"I will store my insulin vials at room temperature.\"",
                "\"I will rotate my injection sites to prevent lipodystrophy.\"",
                "\"I can mix all types of insulin in the same syringe.\""
            ]
        },
        {
            stem: "A client with a diagnosis of pneumonia has the following arterial blood gas results: pH 7.32, PaCO₂ 48 mmHg, PaO₂ 80 mmHg, HCO₃⁻ 24 mEq/L. The nurse interprets these results as indicating which condition?",
            options: [
                "Respiratory acidosis",
                "Respiratory alkalosis",
                "Metabolic acidosis",
                "Metabolic alkalosis"
            ]
        },
        {
            stem: "A nurse is caring for a client who is receiving total parenteral nutrition (TPN) through a central venous catheter. The client suddenly develops shortness of breath, chest pain, and anxiety. What is the priority nursing action?",
            options: [
                "Increase the flow rate of the TPN",
                "Place the client in a supine position",
                "Stop the TPN infusion and place the client in a left lateral recumbent position",
                "Administer oxygen and place the client in a high Fowler's position"
            ]
        },
        // Additional questions
        {
            stem: "A nurse is providing teaching for a client who will be taking warfarin (Coumadin) after discharge. Which statement by the client indicates understanding of the medication teaching?",
            options: [
                "\"I should take aspirin if I develop a headache.\"",
                "\"I should notify my healthcare provider if I notice blood in my urine.\"",
                "\"I can eat green leafy vegetables without any restrictions.\"",
                "\"I should stop taking the medication if I get a nosebleed.\""
            ]
        },
        {
            stem: "A nurse is assessing a client with a diagnosis of pulmonary embolism. Which assessment finding would the nurse expect to observe?",
            options: [
                "Diminished breath sounds in the affected area",
                "Productive cough with purulent sputum",
                "Sudden onset of sharp chest pain that worsens with inspiration",
                "Presence of a friction rub on auscultation"
            ]
        }
    ];
}

/**
 * End the exam
 */
function endExam() {
    // Clear timer interval
    clearInterval(window.examTimerInterval);
    
    // Hide interface
    document.getElementById('simulator-interface').classList.add('hidden');
    
    // Show results
    showResults();
}

/**
 * Show exam results
 */
function showResults() {
    const resultsScreen = document.getElementById('results-screen');
    
    // Calculate results
    const answers = JSON.parse(localStorage.getItem('examAnswers') || '{}');
    const totalQuestions = parseInt(document.getElementById('total-questions').textContent);
    const answeredQuestions = Object.keys(answers).length;
    
    // For demo, we'll consider certain answers as correct based on a fixed pattern or the actual data
    let correctAnswers = {};
    
    // If we have the actual questions loaded, use their correct answers
    if (simulatorQuestions && simulatorQuestions.length > 0) {
        for (let i = 1; i <= totalQuestions; i++) {
            const questionIndex = (i - 1) % simulatorQuestions.length;
            correctAnswers[i] = simulatorQuestions[questionIndex].correctAnswer;
        }
    } else {
        // Fallback pattern for demo
        correctAnswers = {
            1: 3, 2: 1, 3: 2, 4: 0, 5: 3, 6: 1, 7: 2,
            8: 0, 9: 2, 10: 1, 11: 3, 12: 0
        };
    }
    
    let correct = 0;
    Object.keys(answers).forEach(question => {
        if (correctAnswers[question] === answers[question]) {
            correct++;
        }
    });
    
    // Calculate score
    const score = Math.round((correct / totalQuestions) * 100);
    
    // Update results elements
    document.getElementById('results-answered').textContent = `${answeredQuestions}/${totalQuestions}`;
    document.getElementById('results-correct').textContent = correct;
    document.getElementById('results-score').textContent = `${score}%`;
    
    // Get time used
    const endTime = parseInt(localStorage.getItem('examEndTime') || '0');
    const timeUsed = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    const totalSeconds = Math.abs(timeUsed);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    document.getElementById('results-time').textContent = 
        `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    
    // Create breakdown based on the simulation type
    const breakdownDiv = document.getElementById('results-breakdown');
    
    if (currentSimType === 'ngn-full') {
        breakdownDiv.innerHTML = `
            <h3>Performance by Question Type</h3>
            <p>You performed well in:</p>
            <ul>
                <li>Standard multiple choice</li>
                <li>Multiple response select all that apply</li>
            </ul>
            <p>Areas for improvement:</p>
            <ul>
                <li>Drag and Drop case studies</li>
                <li>Cloze (fill-in-the-blank) questions</li>
                <li>Matrix/grid questions</li>
            </ul>
        `;
    } else {
        breakdownDiv.innerHTML = `
            <h3>Performance by Content Area</h3>
            <p>You performed well in:</p>
            <ul>
                <li>Medication administration</li>
                <li>Patient assessment</li>
            </ul>
            <p>Areas for improvement:</p>
            <ul>
                <li>Prioritization of care</li>
                <li>Laboratory value interpretation</li>
            </ul>
        `;
    }
    
    // Show results screen
    resultsScreen.classList.remove('hidden');
    
    // Clear stored answers
    localStorage.removeItem('examAnswers');
    localStorage.removeItem('examEndTime');
    localStorage.removeItem('currentSimType');
}

/**
 * Initialize NGN Examples
 */
function initializeNGNExamples() {
    setupMatrixExample();
    setupClozeExample();
    setupHighlightingExample();
    setupDragAndDropExample();
    setupNGNSimulatorButtons();
}

/**
 * Set up the NGN simulator buttons
 */
function setupNGNSimulatorButtons() {
    const ngnSimButton = document.querySelector('.simulator-cta .start-sim');
    if (ngnSimButton) {
        ngnSimButton.addEventListener('click', function() {
            const simType = this.getAttribute('data-sim');
            showSimulationIntro(simType);
        });
    }
}

/**
 * Set up matrix example
 */
function setupMatrixExample() {
    const matrixCells = document.querySelectorAll('.matrix-cell.selectable');
    
    matrixCells.forEach(cell => {
        cell.addEventListener('click', function() {
            this.classList.toggle('selected');
            if (this.classList.contains('selected')) {
                this.innerHTML = '<i class="fas fa-check"></i>';
            } else {
                this.innerHTML = '';
            }
        });
    });
}

/**
 * Set up cloze (dropdown) example
 */
function setupClozeExample() {
    const dropdowns = document.querySelectorAll('.cloze-dropdown');
    
    dropdowns.forEach(dropdown => {
        const dropdownEl = dropdown;
        
        dropdownEl.addEventListener('click', function(event) {
            event.stopPropagation();
            this.classList.toggle('active');
        });
        
        const options = dropdown.querySelectorAll('.cloze-dropdown-option');
        options.forEach(option => {
            option.addEventListener('click', function(event) {
                event.stopPropagation();
                const selectedOption = this.closest('.cloze-dropdown').querySelector('.selected-option');
                selectedOption.textContent = this.textContent;
                this.closest('.cloze-dropdown').classList.remove('active');
            });
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    });
}

/**
 * Set up highlighting example
 */
function setupHighlightingExample() {
    const paragraph = document.querySelector('.highlight-paragraph');
    
    if (paragraph) {
        paragraph.addEventListener('mouseup', function() {
            const selection = window.getSelection();
            
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                
                if (range.toString().trim() !== '') {
                    const span = document.createElement('span');
                    span.style.backgroundColor = 'yellow';
                    span.className = 'highlighted-text';
                    
                    try {
                        range.surroundContents(span);
                    } catch (e) {
                        console.error('Error highlighting text:', e);
                    }
                    
                    selection.removeAllRanges();
                }
            }
        });
    }
}

/**
 * Set up drag and drop example for NGN questions
 */
function setupDragAndDropExample() {
    if (typeof jQuery === 'undefined') {
        console.error('jQuery is required for drag and drop functionality');
        return;
    }
    
    try {
        // Make items draggable
        $(".parent li").draggable({
            revert: "invalid",
            helper: "clone",
            cursor: "move"
        });
        
        // Make center box droppable
        $(".action_inner_center .action_box_first").droppable({
            accept: ".parent li",
            hoverClass: "active",
            drop: function(event, ui) {
                // Clone the dropped item
                const droppedItem = $(ui.draggable).clone();
                
                // Remove the UI draggable classes and behavior
                droppedItem.removeClass("ui-draggable ui-draggable-handle");
                
                // Add to droppable area
                $(this).append(droppedItem);
                
                // Hide the original item
                $(ui.draggable).hide();
            }
        });
    } catch (e) {
        console.error('Error setting up drag and drop:', e);
    }
}
