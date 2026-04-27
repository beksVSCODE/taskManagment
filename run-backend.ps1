# Script to start the backend with proper environment variables

# Set environment variables
$env:SPRING_PROFILES_ACTIVE = 'dev'

# Navigate to backend directory
cd 'c:\Users\Admin\Desktop\taskManagment\dash_bord'

# Run Maven
Write-Host "Starting backend with dev profile..." -ForegroundColor Green
.\mvnw.cmd spring-boot:run
