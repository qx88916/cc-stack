# CabConnect Backend API Tests
# Run these commands in PowerShell to test the API

$baseUrl = "http://localhost:5000"

# 1. Signup Passenger
Write-Host "`n1. Signup Passenger (root/root)" -ForegroundColor Cyan
$passenger = Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method POST `
    -Body (@{email = "root"; password = "root"; role = "passenger" } | ConvertTo-Json) `
    -ContentType "application/json"
$passengerToken = $passenger.token
Write-Host "Token: $passengerToken" -ForegroundColor Green

# 2. Signup Driver
Write-Host "`n2. Signup Driver (driver/driver)" -ForegroundColor Cyan
$driver = Invoke-RestMethod -Uri "$baseUrl/auth/signup" -Method POST `
    -Body (@{email = "driver"; password = "driver"; role = "driver" } | ConvertTo-Json) `
    -ContentType "application/json"
$driverToken = $driver.token
Write-Host "Token: $driverToken" -ForegroundColor Green

# 3. Login Passenger
Write-Host "`n3. Login Passenger" -ForegroundColor Cyan
$loginPassenger = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST `
    -Body (@{email = "root"; password = "root" } | ConvertTo-Json) `
    -ContentType "application/json"
Write-Host "Logged in as: $($loginPassenger.user.email)" -ForegroundColor Green

# 4. Get Fare Estimate (no auth required)
Write-Host "`n4. Get Fare Estimate" -ForegroundColor Cyan
$estimate = Invoke-RestMethod -Uri "$baseUrl/ride/estimate" -Method POST `
    -Body (@{
        pickup  = @{lat = 40.7128; lng = -74.0060; address = "New York, NY" }
        dropoff = @{lat = 40.7589; lng = -73.9851; address = "Times Square, NY" }
    } | ConvertTo-Json -Depth 3) `
    -ContentType "application/json"
Write-Host "Fare: $($estimate.fare)" -ForegroundColor Green

# 5. Book a Ride (passenger)
Write-Host "`n5. Book a Ride" -ForegroundColor Cyan
$ride = Invoke-RestMethod -Uri "$baseUrl/ride/book" -Method POST `
    -Headers @{Authorization = "Bearer $passengerToken" } `
    -Body (@{
        pickup          = @{lat = 40.7128; lng = -74.0060; address = "New York, NY" }
        dropoff         = @{lat = 40.7589; lng = -73.9851; address = "Times Square, NY" }
        fare            = 15.50
        distanceKm      = 5.2
        durationMinutes = 12
    } | ConvertTo-Json -Depth 3) `
    -ContentType "application/json"
$rideId = $ride._id
Write-Host "Ride ID: $rideId" -ForegroundColor Green

# 6. Get Active Ride (passenger)
Write-Host "`n6. Get Active Ride (Passenger)" -ForegroundColor Cyan
$activeRide = Invoke-RestMethod -Uri "$baseUrl/ride/active" -Method GET `
    -Headers @{Authorization = "Bearer $passengerToken" }
Write-Host "Status: $($activeRide.status)" -ForegroundColor Green

# 7. Driver Sets Availability (online)
Write-Host "`n7. Driver Sets Availability (Online)" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$baseUrl/driver/availability" -Method PATCH `
    -Headers @{Authorization = "Bearer $driverToken" } `
    -Body (@{isOnline = $true } | ConvertTo-Json) `
    -ContentType "application/json"
Write-Host "Driver is now online" -ForegroundColor Green

# 8. Driver Gets Ride Requests
Write-Host "`n8. Driver Gets Ride Requests" -ForegroundColor Cyan
$requests = Invoke-RestMethod -Uri "$baseUrl/driver/ride-requests" -Method GET `
    -Headers @{Authorization = "Bearer $driverToken" }
Write-Host "Pending requests: $($requests.Count)" -ForegroundColor Green

# 9. Get Passenger History
Write-Host "`n9. Get Passenger History" -ForegroundColor Cyan
$history = Invoke-RestMethod -Uri "$baseUrl/history" -Method GET `
    -Headers @{Authorization = "Bearer $passengerToken" }
Write-Host "Total rides: $($history.Count)" -ForegroundColor Green

Write-Host "`n=== Tests Complete ===" -ForegroundColor Yellow
Write-Host "Passenger Token: $passengerToken" -ForegroundColor White
Write-Host "Driver Token: $driverToken" -ForegroundColor White
Write-Host "Last Ride ID: $rideId" -ForegroundColor White
