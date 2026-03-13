// Warmup assignment submission
const fs = require("fs");
function convertAmPmToSeconds(timeStr) {
    timeStr = timeStr.trim();
    let parts = timeStr.split(" ");
    let time = parts[0];
    let period = parts[1];

    let t = time.split(":");
    let h = parseInt(t[0]);
    let m = parseInt(t[1]);
    let s = parseInt(t[2]);

    if (period === "pm" && h !== 12) {
        h += 12;
    }

    if (period === "am" && h === 12) {
        h = 0;
    }

    return h * 3600 + m * 60 + s;
}
function convertTimeToSeconds(timeStr) {
    timeStr = timeStr.trim();
    let parts = timeStr.split(":");

    let h = parseInt(parts[0]);
    let m = parseInt(parts[1]);
    let s = parseInt(parts[2]);

    return h * 3600 + m * 60 + s;
}
function convertSecondsToTime(totalSeconds) {
    let h = Math.floor(totalSeconds / 3600);
    let remainder = totalSeconds % 3600;

    let m = Math.floor(remainder / 60);
    let s = remainder % 60;

    m = String(m).padStart(2, "0");
    s = String(s).padStart(2, "0");

    return h + ":" + m + ":" + s;
}
function getMonthFromDate(dateStr) {
    let parts = dateStr.split("-");
    return parseInt(parts[1]);
}
function isEidPeriod(dateStr) {
    return dateStr >= "2025-04-10" && dateStr <= "2025-04-30";
}

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
    startTime = startTime.trim();
    endTime = endTime.trim();

    let startSeconds = convertAmPmToSeconds(startTime);
    let endSeconds = convertAmPmToSeconds(endTime);

    let durationSeconds = endSeconds - startSeconds;

    return convertSecondsToTime(durationSeconds);    
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    startTime = startTime.trim();
    endTime = endTime.trim();

    let startSeconds = convertAmPmToSeconds(startTime);
    let endSeconds = convertAmPmToSeconds(endTime);

    let startLimit = convertAmPmToSeconds("8:00:00 am");
    let endLimit = convertAmPmToSeconds("10:00:00 pm");

    let idleSeconds = 0;

    if (startSeconds < startLimit) {
        idleSeconds += startLimit - startSeconds;
    }

    if (endSeconds > endLimit) {
        idleSeconds += endSeconds - endLimit;
    }

    return convertSecondsToTime(idleSeconds);
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
    shiftDuration = shiftDuration.trim();
    idleTime = idleTime.trim();

    let shiftSeconds = convertTimeToSeconds(shiftDuration);
    let idleSeconds = convertTimeToSeconds(idleTime);

    let activeSeconds = shiftSeconds - idleSeconds;

    return convertSecondsToTime(activeSeconds);
}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    date = date.trim();
    activeTime = activeTime.trim();

    let activeSeconds = convertTimeToSeconds(activeTime);

    let quotaSeconds;

    if (isEidPeriod(date)) {
        quotaSeconds = convertTimeToSeconds("6:00:00");
    } else {
        quotaSeconds = convertTimeToSeconds("8:24:00");
    }

    return activeSeconds >= quotaSeconds;
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
    let fileContent = fs.readFileSync(textFile, "utf8").trim();
    let lines = fileContent === "" ? [] : fileContent.split("\n");

    for (let i = 0; i < lines.length; i++) {
        let row = lines[i].split(",");
        let driverID = row[0].trim();
        let date = row[2].trim();

        if (driverID === shiftObj.driverID && date === shiftObj.date) {
            return {};
        }
    }

    let shiftDuration = getShiftDuration(shiftObj.startTime, shiftObj.endTime);
    let idleTime = getIdleTime(shiftObj.startTime, shiftObj.endTime);
    let activeTime = getActiveTime(shiftDuration, idleTime);
    let quotaMet = metQuota(shiftObj.date, activeTime);
    let hasBonus = false;

    let newObj = {
        driverID: shiftObj.driverID,
        driverName: shiftObj.driverName,
        date: shiftObj.date,
        startTime: shiftObj.startTime,
        endTime: shiftObj.endTime,
        shiftDuration: shiftDuration,
        idleTime: idleTime,
        activeTime: activeTime,
        metQuota: quotaMet,
        hasBonus: hasBonus
    };

    let newLine = [
        newObj.driverID,
        newObj.driverName,
        newObj.date,
        newObj.startTime,
        newObj.endTime,
        newObj.shiftDuration,
        newObj.idleTime,
        newObj.activeTime,
        newObj.metQuota,
        newObj.hasBonus
    ].join(",");

    let lastIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        let row = lines[i].split(",");
        if (row[0].trim() === shiftObj.driverID) {
            lastIndex = i;
        }
    }

    if (lastIndex === -1) {
        lines.push(newLine);
    } else {
        lines.splice(lastIndex + 1, 0, newLine);
    }

    fs.writeFileSync(textFile, lines.join("\n"));

    return newObj;
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    let fileContent = fs.readFileSync(textFile, "utf8").trim();
    let lines = fileContent.split("\n");

    for (let i = 0; i < lines.length; i++) {
        let row = lines[i].split(",");

        let id = row[0].trim();
        let d = row[2].trim();

        if (id === driverID && d === date) {
            row[9] = newValue;
            lines[i] = row.join(",");
            break;
        }
    }

    fs.writeFileSync(textFile, lines.join("\n"));
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    let fileContent = fs.readFileSync(textFile, "utf8").trim();
    let lines = fileContent.split("\n");

    let targetMonth = parseInt(month);
    let count = 0;
    let foundDriver = false;

    for (let i = 0; i < lines.length; i++) {
        let row = lines[i].split(",");

        let id = row[0].trim();
        let date = row[2].trim();
        let hasBonus = row[9].trim();

        if (id === driverID) {
            foundDriver = true;

            let recordMonth = parseInt(date.split("-")[1]);

            if (recordMonth === targetMonth && hasBonus === "true") {
                count++;
            }
        }
    }

    if (!foundDriver) {
        return -1;
    }

    return count;
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    let fileContent = fs.readFileSync(textFile, "utf8").trim();
    let lines = fileContent.split("\n");

    let totalSeconds = 0;

    for (let i = 0; i < lines.length; i++) {
        let row = lines[i].split(",");

        let id = row[0].trim();
        let date = row[2].trim();
        let activeTime = row[7].trim();

        if (id === driverID) {
            let recordMonth = parseInt(date.split("-")[1]);

            if (recordMonth === parseInt(month)) {
                totalSeconds += convertTimeToSeconds(activeTime);
            }
        }
    }

    return convertSecondsToTime(totalSeconds);
}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    let fileContent = fs.readFileSync(textFile, "utf8").trim();
    let lines = fileContent.split("\n");

    let totalSeconds = 0;

    for (let i = 0; i < lines.length; i++) {
        let row = lines[i].split(",");

        let id = row[0].trim();
        let date = row[2].trim();
        let metQuotaValue = row[8].trim();

        if (id === driverID) {
            let recordMonth = parseInt(date.split("-")[1]);

            if (recordMonth === parseInt(month)) {

                if (metQuotaValue === "true") {

                    if (isEidPeriod(date)) {
                        totalSeconds += convertTimeToSeconds("6:00:00");
                    } else {
                        totalSeconds += convertTimeToSeconds("8:24:00");
                    }

                }

            }
        }
    }

    totalSeconds = totalSeconds - (bonusCount * 2 * 3600);

    if (totalSeconds < 0) {
        totalSeconds = 0;
    }

    return convertSecondsToTime(totalSeconds);
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    let fileContent = fs.readFileSync(rateFile, "utf8").trim();
    let lines = fileContent.split("\n");

    let basePay = 0;
    let tier = 0;

    for (let i = 0; i < lines.length; i++) {
        let row = lines[i].split(",");
        let id = row[0].trim();

        if (id === driverID) {
            basePay = parseInt(row[2].trim());
            tier = parseInt(row[3].trim());
            break;
        }
    }

    let allowedMissingHours = 0;

    if (tier === 1) {
        allowedMissingHours = 50;
    } else if (tier === 2) {
        allowedMissingHours = 20;
    } else if (tier === 3) {
        allowedMissingHours = 10;
    } else if (tier === 4) {
        allowedMissingHours = 3;
    }

    let actualSeconds = convertTimeToSeconds(actualHours.trim());
    let requiredSeconds = convertTimeToSeconds(requiredHours.trim());

    if (actualSeconds >= requiredSeconds) {
        return basePay;
    }

    let missingSeconds = requiredSeconds - actualSeconds;
    let remainingSeconds = missingSeconds - (allowedMissingHours * 3600);

    if (remainingSeconds <= 0) {
        return basePay;
    }

    let billableMissingHours = Math.floor(remainingSeconds / 3600);
    let deductionRatePerHour = Math.floor(basePay / 185);
    let salaryDeduction = billableMissingHours * deductionRatePerHour;
    let netPay = basePay - salaryDeduction;

    return netPay;
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
