# Classic Mode Complete Specification
**Another Hour Project - Classic Mode v1.0**

## 🕒 Core Concept

Classic Mode is the original and most fundamental time design in the Another Hour project. It divides a 24-hour day into two distinct periods:

1.  **Designed 24**: A period of time that is scaled to fit into a user-defined duration. This is the "main" part of the day.
2.  **Another Hour**: A period of real, unscaled time that follows the Designed 24 period.

The user's primary control is a single slider that determines the length of the "Designed 24" period in real time.

### Key Principles

-   **Simplicity**: Control the entire day's flow with a single parameter.
-   **Focus**: Create a compressed "Another Hour" at the end of the day for focused work or reflection.
-   **Flexibility**: Allow the user to decide how much of their day is "designed" versus "real".

## 📐 Mathematical Foundation

The calculation is based on a simple linear scaling of time.

### 1. Parameters

-   `designed24Duration`: The real-time duration in minutes that the "Designed 24" period will occupy.
    -   Range: 1 to 1439 minutes.
    -   Default: 1380 minutes (23 hours).

### 2. Segments

The day is divided into two segments based on the `designed24Duration`.

-   **Designed 24 Segment**:
    -   Starts at `00:00` (0 minutes).
    -   Ends at `designed24Duration` minutes.
-   **Another Hour Segment**:
    -   Starts at `designed24Duration` minutes.
    -   Ends at `24:00` (1440 minutes).

### 3. Time Scale Factor

The scaling factor is only applied during the "Designed 24" segment.

-   **Scale Factor Calculation**:
    \[
    \text{scaleFactor} = \frac{1440}{\text{designed24Duration}}
    \]
    This formula scales a full 24-hour (1440 minute) "designed" day into the available real-time duration.

-   **Another Hour Scale Factor**:
    -   The scale factor is always `1.0` (unscaled time).

## 🎚️ Customization Parameters

The mode is controlled by a single parameter.

-   **Name**: `designed24Duration`
-   **UI Control**: A slider.
-   **Label**: "Designed 24 Duration (minutes)"
-   **Range**: `1` to `1439` minutes.
-   **Default**: `1380` minutes.

## 🔄 Time Calculation Logic (`calculate` method)

1.  **Get Current Time**: Get the current time in minutes since midnight (`realMinutes`).
2.  **Determine Active Segment**:
    -   If `realMinutes` < `designed24Duration`, the active segment is "Designed 24".
    -   Otherwise, the active segment is "Another Hour".
3.  **Calculate Display Time**:
    -   **If in "Designed 24" segment**:
        -   `elapsedRealMinutes = realMinutes`
        -   `scaledElapsedMinutes = elapsedRealMinutes \times \text{scaleFactor}`
        -   The display time is derived from `scaledElapsedMinutes`.
    -   **If in "Another Hour" segment**:
        -   `elapsedRealMinutesInAH = realMinutes - designed24Duration`
        -   The display time is derived from `elapsedRealMinutesInAH`. The Another Hour clock effectively "counts up" from 0.

## 🖼️ UI/UX Specifications

-   **Configuration**: A single slider to control `designed24Duration`.
-   **Display**:
    -   The main clock shows the calculated time.
    -   An indicator should clearly show the current period ("Designed 24" or "Another Hour").
    -   The current scale factor should be visible.

## 🧪 Test Cases

-   **`designed24Duration` = 1380 (23 hours)**:
    -   The first 23 real hours correspond to a full 24-hour designed day. Scale factor ≈ 1.043.
    -   The final real hour is the "Another Hour".
-   **`designed24Duration` = 720 (12 hours)**:
    -   The first 12 real hours correspond to a full 24-hour designed day. Scale factor = 2.0.
    -   The final 12 real hours are the "Another Hour".
-   **Edge Case: `designed24Duration` = 1439**:
    -   The day is scaled almost 1:1, with a very short, 1-minute "Another Hour" at the end.
-   **Edge Case: `designed24Duration` = 1**:
    -   The entire 24-hour designed day is compressed into the first minute of the real day. The rest of the day (23h 59m) is "Another Hour". 