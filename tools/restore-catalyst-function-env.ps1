param(
  [string]$ProjectId = "43505000000424037"
)

$ErrorActionPreference = "Stop"

$required = @("GROQ_API_KEY", "SARVAM_API_KEY", "NVIDIA_NIM_API_KEY")
$missing = @($required | Where-Object { -not [Environment]::GetEnvironmentVariable($_, "Process") })
if ($missing.Count -gt 0) {
  throw "Missing required process environment variables: $($missing -join ', ')"
}

$envMap = @{}
foreach ($name in $required) {
  $envMap[$name] = [Environment]::GetEnvironmentVariable($name, "Process")
}

$configFiles = Get-ChildItem -Path "functions" -Filter "catalyst-config.json" -Recurse

try {
  foreach ($file in $configFiles) {
    $json = Get-Content -LiteralPath $file.FullName -Raw | ConvertFrom-Json
    if (-not $json.deployment.PSObject.Properties["env_variables"]) {
      $json.deployment | Add-Member -MemberType NoteProperty -Name "env_variables" -Value ([pscustomobject]@{})
    }
    foreach ($entry in $envMap.GetEnumerator()) {
      if ($json.deployment.env_variables.PSObject.Properties[$entry.Key]) {
        $json.deployment.env_variables.$($entry.Key) = $entry.Value
      } else {
        $json.deployment.env_variables | Add-Member -MemberType NoteProperty -Name $entry.Key -Value $entry.Value
      }
    }
    $json | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $file.FullName -Encoding UTF8
  }

  catalyst deploy --only functions --project $ProjectId
}
finally {
  foreach ($file in $configFiles) {
    $json = Get-Content -LiteralPath $file.FullName -Raw | ConvertFrom-Json
    if ($json.deployment.PSObject.Properties["env_variables"]) {
      $json.deployment.PSObject.Properties.Remove("env_variables")
      $json | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $file.FullName -Encoding UTF8
    }
  }
}
