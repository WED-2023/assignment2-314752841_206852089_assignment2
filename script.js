let customFireKey = ' '; // default to space
let minGameTime = 120; // default to 120 seconds

let countdownInterval;
let timeRemaining = 0;

let score = 0;
let deaths = 0;

const playerImage = new Image();
const enemyImage = new Image();

playerImage.src = 'images/player_ship.jpg';

function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
  
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
  
      // Lock scrolling for game
      if (screenId === 'game-screen') {
        document.body.classList.add('game-active');
        startGame();
      } else {
        document.body.classList.remove('game-active');
      }
    }
  }
  
  
  
  // Register button click event
  document.getElementById('register-form').addEventListener('submit', function (e) {
    e.preventDefault();
  
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const dob = document.getElementById('dob').value;
    const errorDisplay = document.getElementById('register-error');
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    const nameRegex = /^[A-Za-z]+$/;
  
    if (!username || !password || !confirmPassword || !firstName || !lastName || !email || !dob) {
      errorDisplay.textContent = "All fields must be filled.";
      return;
    }
  
    if (!passwordRegex.test(password)) {
      errorDisplay.textContent = "Password must be at least 8 characters and include both letters and numbers.";
      return;
    }
  
    if (password !== confirmPassword) {
      errorDisplay.textContent = "Passwords do not match.";
      return;
    }
  
    if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
      errorDisplay.textContent = "First and last names must not contain numbers.";
      return;
    }
  
    if (!emailRegex.test(email)) {
      errorDisplay.textContent = "Invalid email format.";
      return;
    }
  
    // If all checks pass
    const newUser = {
        username,
        password, // In production, never store plaintext passwords
        firstName,
        lastName,
        email,
        dob
    };
  
    let users = JSON.parse(localStorage.getItem('users')) || [];
  
    // Check for existing username or email
    const usernameExists = users.some(user => user.username === username);
    const emailExists = users.some(user => user.email === email);
    
    if (usernameExists) {
        errorDisplay.textContent = "Username already exists.";
        return;
    }
    
    if (emailExists) {
        errorDisplay.textContent = "Email already registered.";
        return;
    }
    
    // Add and save the new user
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    errorDisplay.style.color = "red";
    errorDisplay.textContent = "Registration successful!";
    this.reset();  // Clear the form
    
  });
  
  // Ensure special user "p" exists on every load
window.addEventListener('load', () => {
    let users = JSON.parse(localStorage.getItem('users')) || [];
  
    const specialUserExists = users.some(user => user.username === 'p');
    if (!specialUserExists) {
      users.push({
        username: 'p',
        password: 'testuser',
        firstName: 'Preset',
        lastName: 'User',
        email: 'p@example.com',
        dob: '1990-01-01'
      });
      localStorage.setItem('users', JSON.stringify(users));
    }
  });
  
  // Login logic
  document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
  
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorDisplay = document.getElementById('login-error');
  
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const matchedUser = users.find(user => user.username === username && user.password === password);
  
    if (matchedUser) {
      errorDisplay.style.color = 'green';
      errorDisplay.textContent = 'Login successful!';
      setTimeout(() => {
        showScreen('configScreen');
      }, 500); // small delay for UX
    } else {
      errorDisplay.textContent = 'Invalid username or password.';
    }
  });

  const aboutModal = document.getElementById('about-modal');
const closeAboutBtn = document.getElementById('close-about');

function openAboutModal() {
  if (!aboutModal.open) {
    aboutModal.showModal();
  }
}

function closeAboutModal() {
  aboutModal.close();
}

// Close when clicking the X
closeAboutBtn.addEventListener('click', closeAboutModal);

// Close on ESC key
aboutModal.addEventListener('cancel', (e) => {
  e.preventDefault(); // prevent default ESC behavior to avoid instant close
  closeAboutModal();
});

// Close when clicking outside the dialog content
aboutModal.addEventListener('click', (event) => {
  const dialogRect = aboutModal.getBoundingClientRect();
  const clickedInside = (
    event.clientX >= dialogRect.left &&
    event.clientX <= dialogRect.right &&
    event.clientY >= dialogRect.top &&
    event.clientY <= dialogRect.bottom
  );
  if (!clickedInside) {
    closeAboutModal();
  }
});

function updateTimerDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  document.getElementById('gameTimer').textContent =
    `Time: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateScoreDisplay() {
  document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
}

function updateLivesDisplay() {
  document.getElementById('livesDisplay').textContent = `Lives: ${3 - deaths}`;
}

function displayGameOverText(txt) {
  document.getElementById('gameOverText').textContent = txt;
}

function startGame() {
    score = 0;
    updateScoreDisplay();

    deaths = 0;
    updateLivesDisplay();

    document.getElementById('gameOverScreen').style.display = 'none';
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
  
    const shipWidth = 60;
    const shipHeight = 20;
    let startingPointY = canvas.height - shipHeight - 145; 

    let shipX = (canvas.width - shipWidth) / 2;
    let shipY = startingPointY; // Start ship at the bottom of the canvas
  
    const shipSpeed = 5;
    const keys = {
      ArrowLeft: false,
      ArrowRight: false,
      ArrowUp: false,
      ArrowDown: false,
    };

    let lastShotTime = 0;
    const fireRate = 500;  // 500ms cooldown (2 bullets per second)

    const upperMovementLimit = canvas.height * 0.65;
    const lowerMovementLimit = startingPointY;
  
    let bullets = [];
    const bulletSpeed = 7;
    const bulletWidth = 5;
    const bulletHeight = 10;

    const enemies = [];
    const enemyRows = 4;
    const enemyCols = 5;
    const enemyWidth = 50;
    const enemyHeight = 30;
    const enemyPadding = 20;
    const enemyOffsetTop = 40;
    const enemyOffsetLeft = 100;

    let enemyBullets = [];
    let enemyBulletSpeed = 3;
    const enemyBulletWidth = 5;
    const enemyBulletHeight = 10;
    const enemyFireRate = 1750;  // Time in ms between each random enemy fire

    let speedUpCounts = 0; // Number of speed-ups used
    const maxSpeedUps = 4; // Maximum number of speed-ups allowed

    let lastEnemyFireTime = 0;

    let enemyDirection = 1;  // 1 means moving right, -1 means moving left
    let enemySpeed = 1;
    
    let isGameOver = false;

    // Set and display the starting countdown
    timeRemaining = minGameTime;
    updateTimerDisplay();
    countdownInterval = setInterval(() => {
      timeRemaining--;
      updateTimerDisplay();

      if (timeRemaining <= 0) {
        clearInterval(countdownInterval);
        isGameOver = true;
        showGameOverScreen();
      }
    }, 1000);

    // Populate enemies in a 5x4 grid
    for (let row = 0; row < enemyRows; row++) {
        for (let col = 0; col < enemyCols; col++) {
            const x = enemyOffsetLeft + col * (enemyWidth + enemyPadding);
            const y = enemyOffsetTop + row * (enemyHeight + enemyPadding);
            enemies.push({ x, y, width: enemyWidth, height: enemyHeight });
        }
    }
    
    // Event listeners for keypresses
    document.addEventListener('keydown', (e) => {
        if (e.key in keys) {
          keys[e.key] = true;
        }
      
        // Spacebar logic for firing bullets with cooldown
        if (e.key.toLowerCase() === customFireKey.toLowerCase()) {
          const currentTime = Date.now();
          if (currentTime - lastShotTime >= fireRate) {
            // Fire a bullet and update last shot time
            bullets.push({
              x: shipX + shipWidth / 2 - bulletWidth / 2,
              y: shipY
            });
            lastShotTime = currentTime;
          }
        }
      });
      
  
    document.addEventListener('keyup', (e) => {
      if (e.key in keys) {
        keys[e.key] = false;
      }
    });

    function update() {
      if (keys.ArrowLeft && shipX > 0) {
        shipX -= shipSpeed;
      }
      if (keys.ArrowRight && shipX < canvas.width - shipWidth) {
        shipX += shipSpeed;
      }
      if (keys.ArrowUp && shipY > upperMovementLimit) {
        shipY -= shipSpeed;
      }
      if (keys.ArrowDown && shipY < lowerMovementLimit) {
        shipY += shipSpeed;
      }
    }

    function updateEnemies() {
        let atEdge = false;
      
        enemies.forEach(enemy => {
          enemy.x += enemySpeed * enemyDirection;
      
          // Check if any enemy is at the left or right edge
          if (enemy.x <= enemyOffsetLeft || enemy.x >= canvas.width - enemyWidth - enemyOffsetLeft) {
            atEdge = true;
          }
        });
      
        // Reverse direction and move enemies down if they reach the edge
        if (atEdge) {
          enemyDirection *= -1;  // Reverse direction
        //   enemies.forEach(enemy => {
        //     enemy.y += enemyHeight + enemyPadding;  // Move down
        //   });
        }
      }
      
    
    function drawEnemies() {
        ctx.fillStyle = 'lime';
        enemies.forEach(enemy => {
          ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });
    }
      
      
    function drawShip() {
      ctx.fillStyle = 'white';
      ctx.fillRect(shipX, shipY, shipWidth, shipHeight);
      // ctx.drawImage(playerImage, shipX, shipY, shipWidth, shipHeight); // Draw the player shipz
    }

    function enemyFire() {
        const currentTime = Date.now();
        // Fire only if the previous bullet has traveled 3/4 of the screen
        if (currentTime - lastEnemyFireTime >= enemyFireRate) {
          const availableEnemies = enemies.filter(enemy => !enemy.hasFired); // Only allow enemies that haven't fired yet
          if (availableEnemies.length > 0) {
            // Pick a random enemy to fire
            const randomEnemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
            enemyBullets.push({
              x: randomEnemy.x + randomEnemy.width / 2 - enemyBulletWidth / 2, // Bullet starts at the enemy's center
              y: randomEnemy.y + randomEnemy.height,
              hasFired: true
            });
            lastEnemyFireTime = currentTime;
          }
        }
      }
      
        
    function updateBullets() {
        // Move bullets upward
        bullets = bullets.filter(bullet => bullet.y > -bulletHeight); // Keep only visible bullets
        bullets.forEach(bullet => {
          bullet.y -= bulletSpeed;
        });
      }

      function updateEnemyBullets() {
        enemyBullets.forEach(bullet => {
          bullet.y += enemyBulletSpeed;  // Move the bullet downwards
        });
      
        // Remove bullets that have gone off the screen
        enemyBullets = enemyBullets.filter(bullet => bullet.y < canvas.height);
      }
      
      
    function drawBullets() {
        ctx.fillStyle = 'red';
        bullets.forEach(bullet => {
            ctx.fillRect(bullet.x, bullet.y, bulletWidth, bulletHeight);
        });
    }

    function drawEnemyBullets() {
        ctx.fillStyle = 'red';  // Enemy bullets are red
        enemyBullets.forEach(bullet => {
            ctx.fillRect(bullet.x, bullet.y, enemyBulletWidth, enemyBulletHeight);
        });
    }
    
    function checkEnemyBulletCollision() {
        enemyBullets.forEach((bullet, index) => {
          // Check if the bullet intersects with the player's ship
          if (
            bullet.x < shipX + shipWidth &&
            bullet.x + enemyBulletWidth > shipX &&
            bullet.y < shipY + shipHeight &&
            bullet.y + enemyBulletHeight > shipY
          ) {
            // Collision detected, reset the player's ship
            resetPlayerShip();
            updateLivesDisplay(); // Update the lives display
            // Optionally, remove the bullet
            enemyBullets.splice(index, 1);  // Remove the bullet from the array
          }
        });
    }

    function resetPlayerShip() {
        deaths++;
        if (deaths >= 3) {
          isGameOver = true;
          showGameOverScreen();
        } else {
          shipX = canvas.width / 2 - shipWidth / 2;
          shipY = startingPointY; // Reset ship position
        }
    }
      

    function checkPlayerBulletCollision() {
        bullets.forEach((bullet, bulletIndex) => {
          enemies.forEach((enemy, enemyIndex) => {
            // Check if the bullet intersects with the enemy
            if (
              bullet.x < enemy.x + enemy.width &&
              bullet.x + bulletWidth > enemy.x &&
              bullet.y < enemy.y + enemy.height &&
              bullet.y + bulletHeight > enemy.y
            ) {
              // Add points based on the row of the enemy
              if (enemy.y >= 150 && enemy.y < 200) {
                score += 5;  // Bottom row (4th row)
              } else if (enemy.y >= 100 && enemy.y < 150) {
                score += 10; // 3rd row
              } else if (enemy.y >= 50 && enemy.y < 100) {
                score += 15; // 2nd row
              } else if (enemy.y >= 0 && enemy.y < 50) {
                score += 20; // Top row (1st row)
              }
              
              updateScoreDisplay(); // Update the score display
      
              // Remove the bullet and enemy
              bullets.splice(bulletIndex, 1);  // Remove the bullet
              enemies.splice(enemyIndex, 1);   // Remove the enemy
            }
          });
        });
      }
      
    
    function drawScore() {
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('Score: ' + score, 10, 30);  // Position score at the top-left
    }

    function showGameOverScreen() {
        document.getElementById('finalScore').textContent = 'Score: ' + score;
        document.getElementById('gameOverScreen').style.display = 'block';
        
        if (deaths >= 3) {
          displayGameOverText('You Lost!');
        }
        else if (score === 250){
          displayGameOverText('Champion!');
        }
        else if (timeRemaining <= 0) {
          if (score < 100) {
            displayGameOverText('You can do better');
          }
          else {
            displayGameOverText('Winner!')
          }
        }
    }

    function increaseDifficulty() {
        if (speedUpCount >= maxSpeedUps) return;
      
        speedUpCount++;
        enemySpeed += 10; // Adjust to your preferred scale
        enemyBulletSpeed += 10;
    }
      
    function gameLoop() {
        if (isGameOver) return;  // Stop the game loop if game is over

        if (score == 250) { // Check if the score is 250 and stops the game
            isGameOver = true;
            showGameOverScreen();
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
      
        update();
        updateBullets();
        updateEnemies();
        updateEnemyBullets(); // Update enemy bullets
      
        drawShip();
        drawBullets();
        drawEnemies();
        drawEnemyBullets(); // Draw enemy bullets
        
        enemyFire(); // Check for enemy firing
      
        checkEnemyBulletCollision(); // Check for collisions with enemy bullets
        checkPlayerBulletCollision(); // Check for collisions with player bullets

        requestAnimationFrame(gameLoop);
    }
      
    gameLoop();      
  }

  window.onload = function () {
    // This ensures everything is loaded
    showScreen('main-menu'); // or wherever you want to start
  };
  
  window.addEventListener("keydown", function (e) {
    const keysToBlock = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "];
    if (keysToBlock.includes(e.key)) {
      e.preventDefault();
    }
  }, false);

  document.getElementById('startGameBtn').addEventListener('click', () => {
    const keyInput = document.getElementById('fireKey').value.trim();
    const timeInput = parseInt(document.getElementById('minTime').value.trim());
  
    if (isNaN(timeInput) || timeInput < 120) {
      alert('Please enter a minimum game time of at least 120 seconds.');
      return;
    }
  
    customFireKey = keyInput;
    if (keyInput.length === 0) {
      customFireKey = ' '; // default to space if empty 
    }

    minGameTime = timeInput;
  
    showScreen('game-screen');
  });
  
  
  