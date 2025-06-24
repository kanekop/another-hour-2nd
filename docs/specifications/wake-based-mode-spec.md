# Wake-Based Mode Complete Specification
**Another Hour Project - Wake-Based Mode v1.0**

## 🌅 Core Concept

Wake-Based Mode redesigns the day based on a user's actual wake-up time. The core idea is to treat the period from wake-up to midnight as the primary "active" part of the day, and to insert a focused "Another Hour" at the very end of this period.

### Key Principles

-   **User-Centric Start**: The day's design begins when the user wakes up, not at a fixed time like midnight.
-   **Productive End**: The day culminates in a focused, unscaled "Another Hour" just before midnight.
-   **Dynamic Scaling**: The length of the main "Designed Day" period is dynamically scaled to fit the time between wake-up and the start of the final Another Hour.

## 📐 Mathematical Foundation

The day is divided into three distinct segments based on two primary user inputs.

### 1. Parameters

-   `wakeTime`: The user's wake-up time for the day, in `HH:MM` format. (e.g., "07:00").
-   `anotherHourDuration`: The desired length of the final "Another Hour" period, in minutes.
    -   Range: 0 to 720 minutes.
    -   Default: 60 minutes.

### 2. Segments

The 24-hour day (1440 minutes) is partitioned as follows:

1.  **Night Segment (Sleep)**:
    -   Starts at `00:00`.
    -   Ends at the user's `wakeTime`.
    -   Time is **unscaled** (scale factor = 1.0). This is considered "off-the-clock" time.

2.  **Designed Day Segment**:
    -   Starts at `wakeTime`.
    -   Ends at `24:00 - anotherHourDuration`.
    -   Time is **dynamically scaled** to ensure the active day (from wake-up to midnight) is "redesigned".

3.  **Another Hour Segment**:
    -   Starts at `24:00 - anotherHourDuration`.
    -   Ends at `24:00` (1440 minutes).
    -   Time is **unscaled** (scale factor = 1.0).

### 3. Time Scale Factor Calculation

The scale factor is only applied during the "Designed Day" segment.

-   **1. Calculate Durations (in minutes)**:
    -   `wakeTimeMinutes = parse(wakeTime)`
    -   `totalActivityMinutes = 1440 - wakeTimeMinutes` (Time from wake-up to midnight)
    -   `designedRealDuration = totalActivityMinutes - anotherHourDuration`

-   **2. Calculate Scale Factor**:
    \[
    \text{scaleFactor} = \frac{\text{totalActivityMinutes}}{\text{designedRealDuration}}
    \]
    This formula stretches or compresses the entire active day (`totalActivityMinutes`) to fit into the real-time duration available before the final Another Hour (`designedRealDuration`).

## 🔄 Time Calculation Logic (`calculate` method)

1.  **Get Current Time**: Get the current time in minutes since midnight (`realMinutes`).
2.  **Determine Active Segment**:
    -   If `realMinutes` < `wakeTimeMinutes`: "Night Segment".
    -   If `realMinutes` >= `1440 - anotherHourDuration`: "Another Hour Segment".
    -   Otherwise: "Designed Day Segment".
3.  **Calculate Display Time**:
    -   **If in "Night Segment"**:
        -   Time is unscaled. The display time can simply be the real time, or a countdown to wake-up.
    -   **If in "Designed Day Segment"**:
        -   `elapsedRealMinutesInDay = realMinutes - wakeTimeMinutes`
        -   `scaledElapsedMinutes = elapsedRealMinutesInDay \times \text{scaleFactor}`
        -   The display time starts from `wakeTime` and advances by `scaledElapsedMinutes`.
        -   `displayTotalMinutes = wakeTimeMinutes + scaledElapsedMinutes`
    -   **If in "Another Hour Segment"**:
        -   Time is unscaled. The display clock shows a countdown from `anotherHourDuration` to 0.

## 🖼️ UI/UX Specifications

-   **Configuration**:
    1.  A time input for `wakeTime`.
    2.  A slider for `anotherHourDuration`.
-   **Display**:
    -   The main clock shows the calculated time.
    -   A clear indicator for the current segment ("Night", "Designed Day", "Another Hour").
    -   The current scale factor (only active during "Designed Day").

## 🧪 Test Cases

-   **Standard Scenario**:
    -   `wakeTime` = "07:00" (420 minutes)
    -   `anotherHourDuration` = 60 minutes
    -   `totalActivityMinutes` = 1440 - 420 = 1020 min
    -   `designedRealDuration` = 1020 - 60 = 960 min
    -   `scaleFactor` = 1020 / 960 = 1.0625
    -   Segments:
        -   Night: 00:00 - 07:00 (unscaled)
        -   Designed Day: 07:00 - 23:00 (scaled at 1.0625x)
        -   Another Hour: 23:00 - 24:00 (unscaled)

-   **Long Another Hour**:
    -   `wakeTime` = "08:00" (480 minutes)
    -   `anotherHourDuration` = 180 minutes (3 hours)
    -   `totalActivityMinutes` = 1440 - 480 = 960 min
    -   `designedRealDuration` = 960 - 180 = 780 min
    -   `scaleFactor` = 960 / 780 ≈ 1.23
    -   Segments:
        -   Night: 00:00 - 08:00 (unscaled)
        -   Designed Day: 08:00 - 21:00 (scaled at ~1.23x)
        -   Another Hour: 21:00 - 24:00 (unscaled) 