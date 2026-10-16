"""EcoTwin AI - Deterministic Simulation Math Service
Pure mathematical functions executing strictly without AI, randomness, or floating-point instability.
Every function guarantees bit-for-bit repeatability across executions.
"""

from typing import Optional


# ============================================================================
# ENERGY CALCULATIONS (kWh = kW * hours * days)
# ============================================================================

def calculate_energy_kwh(power_kw: float, operating_hours_per_day: float, operating_days: float) -> float:
    """Calculates cumulative electrical energy consumption.
    
    Formula: energy_kwh = power_kw * operating_hours_per_day * operating_days
    
    Raises:
        ValueError: If power_kw < 0 (ERR_NEGATIVE_VALUE)
        ValueError: If operating_hours_per_day < 0 or > 24 (ERR_HOURS_EXCEEDS_24 or ERR_NEGATIVE_VALUE)
        ValueError: If operating_days < 0 (ERR_NEGATIVE_DAYS)
    """
    if power_kw < 0.0:
        raise ValueError("ERR_NEGATIVE_VALUE: power_kw cannot be negative")
    if operating_hours_per_day < 0.0:
        raise ValueError("ERR_NEGATIVE_VALUE: operating_hours_per_day cannot be negative")
    if operating_hours_per_day > 24.0:
        raise ValueError("ERR_HOURS_EXCEEDS_24: operating_hours_per_day cannot exceed 24.0 hours")
    if operating_days < 0.0:
        raise ValueError("ERR_NEGATIVE_DAYS: operating_days cannot be negative")

    return float(power_kw * operating_hours_per_day * operating_days)


def calculate_energy_saved_kwh(baseline_energy_kwh: float, scenario_energy_kwh: float) -> float:
    """Calculates absolute energy savings between baseline and simulated scenario.
    
    Formula: energy_saved_kwh = baseline_energy_kwh - scenario_energy_kwh
    
    Note: If scenario > baseline, energy_saved_kwh is negative (rebound effect).
    Negative savings are preserved and never clamped to zero.
    
    Raises:
        ValueError: If baseline or scenario is negative.
    """
    if baseline_energy_kwh < 0.0 or scenario_energy_kwh < 0.0:
        raise ValueError("ERR_NEGATIVE_VALUE: baseline and scenario energy must be non-negative")

    return float(baseline_energy_kwh - scenario_energy_kwh)


def calculate_reduction_percent(baseline_energy_kwh: float, scenario_energy_kwh: float) -> Optional[float]:
    """Calculates percentage reduction relative to baseline energy.
    
    Formula: reduction_percent = (energy_saved_kwh / baseline_energy_kwh) * 100
    
    Returns:
        float: Percentage reduction (positive or negative).
        None: When baseline_energy_kwh == 0.0 (Status: UNDEFINED_ZERO_BASELINE) to prevent div/0 crash.
    """
    if baseline_energy_kwh < 0.0 or scenario_energy_kwh < 0.0:
        raise ValueError("ERR_NEGATIVE_VALUE: baseline and scenario energy must be non-negative")

    if baseline_energy_kwh == 0.0:
        return None

    energy_saved = calculate_energy_saved_kwh(baseline_energy_kwh, scenario_energy_kwh)
    return float((energy_saved / baseline_energy_kwh) * 100.0)


# ============================================================================
# WATER CALCULATIONS (Litres = L/min * minutes)
# ============================================================================

def calculate_water_leak_volume_litres(flow_litres_per_minute: float, duration_minutes: float) -> float:
    """Calculates accumulated lost water volume from flow rate and duration.
    
    Formula: leak_volume_litres = flow_litres_per_minute * duration_minutes
    
    Raises:
        ValueError: If flow or duration is negative.
    """
    if flow_litres_per_minute < 0.0 or duration_minutes < 0.0:
        raise ValueError("ERR_NEGATIVE_VALUE: flow_litres_per_minute and duration_minutes cannot be negative")

    return float(flow_litres_per_minute * duration_minutes)


def calculate_water_saved_litres(baseline_litres: float, scenario_litres: float) -> float:
    """Calculates water volume saved through leak repair or flow remediation.
    
    Formula: water_saved_litres = baseline_litres - scenario_litres
    """
    if baseline_litres < 0.0 or scenario_litres < 0.0:
        raise ValueError("ERR_NEGATIVE_VALUE: water volumes must be non-negative")

    return float(baseline_litres - scenario_litres)


def calculate_water_reduction_percent(baseline_litres: float, scenario_litres: float) -> Optional[float]:
    """Calculates water leakage reduction percentage.
    
    Returns:
        float: Reduction percentage.
        None: When baseline_litres == 0.0 (UNDEFINED_ZERO_BASELINE).
    """
    if baseline_litres < 0.0 or scenario_litres < 0.0:
        raise ValueError("ERR_NEGATIVE_VALUE: water volumes must be non-negative")

    if baseline_litres == 0.0:
        return None

    saved = calculate_water_saved_litres(baseline_litres, scenario_litres)
    return float((saved / baseline_litres) * 100.0)


# ============================================================================
# WASTE CALCULATIONS (kg = total_kg * fraction)
# ============================================================================

def calculate_segregated_waste_kg(total_waste_kg: float, segregation_fraction: float) -> float:
    """Calculates mass of properly segregated waste based on total waste and fraction.
    
    Formula: segregated_waste_kg = total_waste_kg * segregation_fraction
    
    Raises:
        ValueError: If total_waste_kg < 0.0 (ERR_NEGATIVE_VALUE)
        ValueError: If segregation_fraction < 0.0 or > 1.0 (ERR_INVALID_FRACTION_RANGE)
    """
    if total_waste_kg < 0.0:
        raise ValueError("ERR_NEGATIVE_VALUE: total_waste_kg cannot be negative")
    if segregation_fraction < 0.0 or segregation_fraction > 1.0:
        raise ValueError("ERR_INVALID_FRACTION_RANGE: segregation_fraction must be in range [0.0, 1.0]")

    return float(total_waste_kg * segregation_fraction)


def calculate_waste_segregation_diff_kg(baseline_segregated_kg: float, scenario_segregated_kg: float) -> float:
    """Calculates change in segregated waste mass between baseline and scenario.
    
    Formula: diff_kg = scenario_segregated_kg - baseline_segregated_kg
    (Positive difference means higher segregation achieved).
    """
    if baseline_segregated_kg < 0.0 or scenario_segregated_kg < 0.0:
        raise ValueError("ERR_NEGATIVE_VALUE: waste masses must be non-negative")

    return float(scenario_segregated_kg - baseline_segregated_kg)


def calculate_waste_segregation_diff_percent(baseline_segregated_kg: float, scenario_segregated_kg: float) -> Optional[float]:
    """Calculates percentage improvement in segregated waste mass.
    
    Returns:
        float: Percentage increase.
        None: When baseline_segregated_kg == 0.0 (UNDEFINED_ZERO_BASELINE).
    """
    if baseline_segregated_kg < 0.0 or scenario_segregated_kg < 0.0:
        raise ValueError("ERR_NEGATIVE_VALUE: waste masses must be non-negative")

    if baseline_segregated_kg == 0.0:
        return None

    diff = calculate_waste_segregation_diff_kg(baseline_segregated_kg, scenario_segregated_kg)
    return float((diff / baseline_segregated_kg) * 100.0)
