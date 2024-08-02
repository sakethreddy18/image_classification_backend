const ScanHistory = require('../models/scanhistory.model');
const ScanImages = require('../models/scanimages.model');

var log = require("../config/winston");
const { to, ReE, ReS } = require('../services/util.service');
// endpoint to send the data that the frontend can use to filter the data
const getFilterByData = async function (req, res) {
    let err, genderData, ageGroupData, filterData; // declare variables
    let toResponse, response = [null, null]; // declare await to response array

    toResponse = (await to(ScanHistory.find().distinct("gender"))); // get sample ids from database
    err = toResponse[0];
    genderData = toResponse[1]
    if (err) {
        console.log("Error: while getting filter data.");
        console.log(err);
        log.error("Error: while getting filter data.");
        log.error(err);
        return ReE(res, err, 422);
    }

    toResponse = (await to(ScanHistory.find().distinct("ageGroup"))); // get sample ids from database
    err = toResponse[0];
    ageGroupData = toResponse[1]
    if (err) {
        console.log("Error: while getting filter data.");
        console.log(err);
        log.error("Error: while getting filter data.");
        log.error(err);
        return ReE(res, err, 422);
    }
    filterData = {
        genderData: genderData,
        ageGroupData: ageGroupData
    }

    ReS(res, filterData, 200, "Successfully retrieved filter data"); // send response
}
module.exports.getFilterByData = getFilterByData;


const getScans = async function (req, res) {
    let body = req.body; // get request body
    let err, scans; // declare variables
    let toResponse = [null, null]; // declare await to response array
    if (body.pageSize === "" || body.pageNumber === "") {
        return ReE(res, "Invalid request", 422);
    }
    let pageSize = body.pageSize ? !isNaN(parseInt(body.pageSize)) ? parseInt(body.pageSize) : ReE(res, "Invalid page size", 422) : 10; // set page size
    let pageNumber = body.pageNumber ? !isNaN(parseInt(body.pageNumber)) ? parseInt(body.pageNumber) : ReE(res, "Invalid page number", 422) : 1; // set page number

    // check if page number is less than 1 or page size is less than 1
    if (pageNumber < 1 || pageSize < 1) {
        return ReE(res, "Invalid page number or page size", 422);
    }
    if (pageSize > 1000) {
        pageSize = 1000;
    }

    let filterBy = {}; // declare filterBy object
    if (body.searchValues && body.searchValues.length > 0) {
        filterBy = { $and: [] };
        for (let i = 0; i < body.searchValues.length; i++) {
            let field = body.searchValues[i].field;
            let value = body.searchValues[i].value;
            // contains search
            if (field == "search" && value !== "" && value !== undefined) {
                filterBy.$and.push({
                    $or: [
                        { "sampleId": { $regex: value, $options: 'i' } },
                        { "deviceId": { $regex: value, $options: 'i' } },
                        { "gender": { $regex: value, $options: 'i' } }
                    ]
                });
            }
            else if (field !== "search" && typeof value === "string") {
                if (field !== "" && value !== "") {
                    filterBy.$and.push({ [body.searchValues[i].field]: { $regex: body.searchValues[i].value, $options: 'i' } }); // set filter by
                }
            } else if (typeof value === 'object' && value.length !== 0) {
                filterBy.$and.push({ [body.searchValues[i].field]: { $in: body.searchValues[i].value } }); // set filter by
            }
        }
        if (filterBy.$and.length === 0) {
            delete filterBy.$and;
        }
    }

    let sortBy = {}; // declare sortBy object
    if (body.order && body.order.columns && body.order.columns.length > 0) {
        let columns = body.order.columns ? body.order.columns : []; // get columns from request body
        let direction = body.order.direction ? body.order.direction : []; // get order from request body
        if (columns.length !== direction.length) {
            return ReE(res, "Invalid sort order", 422);
        }
        for (let i = 0; i < columns.length; i++) {

            if (columns[i] !== "" && direction[i] !== "")
                sortBy[columns[i]] = direction[i] === "asc" ? 1 : -1; // set sort by
        }
    } else {
        // default sort by createdAt in descending order
        sortBy = { createdAt: -1 };
    }
    scanCount = await ScanHistory.find(filterBy).countDocuments(); // get scan count from database
    if (scanCount === 0) {
        return ReE(res, "Scans not found", 404);// return if no documents according to the filter
    }
    toResponse = (await to(ScanHistory.find(filterBy).sort(sortBy).limit(pageSize).skip((pageNumber - 1) * pageSize).select("-updatedAt"))); // get scans from database
    err = toResponse[0];
    scans = toResponse[1];
    if (err) {
        console.log("Error: while getting scans.");
        console.log(err);
        log.error("Error: while getting scans.");
        log.error(err);
        return ReE(res, err, 422);
    }
    // check if scans is empty
    if (scans.length === 0) {
        return ReE(res, "Scans not found", 404);
    }
    let response = {
        records: scans.map(scan => scan.toWeb()), // map scans to response
        pagination: {
            pageSize: pageSize, // send page size in response
            pageNumber: pageNumber, // send total records in response
            totalPages: Math.ceil(scanCount / pageSize), // send total pages in response
            totalRecords: scanCount,
            filteredRecords: scans.length,
            searchValues: body.searchValues,
            order: body.order
        }
    }
    ReS(res, response, 200, "Successfully retrieved scans"); // send response
}
module.exports.getScans = getScans;

// function to change the data to the response format
const toResponseFormat = function (scanImages, report) {
    // sort report array by class names
    let responseClass = report.map(classObj => classObj.className).sort().map(className => report.find(classObj => classObj.className === className));
    responseClass = responseClass.map(classObj => {
        return {
            className: classObj.className,
            count: classObj.count,
            percentage: classObj.percentage,
            images: []
        }
    });
    // images to the respective classes
    for (let image of scanImages.images) {
        classNumber = responseClass.findIndex(cls => cls.className === image.class);
        if (classNumber === -1) {
            responseClass.push({ className: image.class, count: 0, percentage: 0, images: [] });
            classNumber = responseClass.length - 1;
        }
        image_name = image.path.split("/").pop();
        responseClass[classNumber].images.push({
            _id: image._id,
            imageName: image_name,
            path: image.path,
            class: image.class,
        });
    }
    let response = {
        _id: scanImages._id,
        classes: responseClass
    }
    return response;
}

const getScan = async function (req, res) {
    const body = req.body;  // get id from request body
    let err, scanImages; // declare variables
    let toResponse = [null, null]; // declare await to response array
    // get images from scan_images collection
    toResponse = await to(ScanImages.findOne({ _id: body.id }).select("-images.reclassificationHistory -updatedAt"))
    err = toResponse[0];
    scanImages = toResponse[1];
    if (err) {
        console.log("Error: while getting images.");
        console.log(err);
        log.error("Error: while getting images.");
        log.error(err);
        return ReE(res, err, 422);
    }
    if (!scanImages) {
        return ReE(res, "Images not found", 404);
    }
    let response = toResponseFormat(scanImages, scanImages.report[scanImages.report.length - 1]['details']); // convert scan to response

    return ReS(res, response, 200, "Successfully retrieved scan"); // send response
}
module.exports.getScan = getScan;

const createScan = async function (req, res) {
    const body = req.body; // get scan from request body
    let err, newScan; // declare variables
    let toResponse = [null, null]; // declare await to response array
    let requiredFields = [
        "sampleId", // check if required fields are present in request body
        "gender",
        "ageGroup",
        "deviceId"
    ];
    for (let field of requiredFields) {
        if (!body[field]) {
            console.log("Error: " + field + " not found.");
            log.info(field + " not found.");
            return ReE(res, field + " not found.", 422);
        }
    }
    toResponse = await to(ScanHistory.create(body)); // create scan
    err = toResponse[0];
    newScan = toResponse[1];
    if (err) {
        console.log("Error: while creating scan.");
        console.log(err);
        log.error("Error: while creating scan.");
        log.error(err);
        return ReE(res, err, 422);
    }
    ReS(res, newScan.toWeb(), 201, "Successfully created scan"); // send response
}
module.exports.createScan = createScan;

const addImagesToScan = async function (req, res) {
    const body = req.body; // get request body
    let err, scan; // declare variables
    let toResponse = [null, null]; // declare await to response array
    let requiredFields = [
        "scanId", // check if required fields are present in request body
        "images"
    ];
    for (let field of requiredFields) {
        if (!body[field]) {
            console.log("Error: " + field + " not found.");
            log.info(field + " not found.");
            return ReE(res, field + " not found.", 422);
        }
    }
    // fetch te document from the database
    toResponse = await to(ScanImages.findOne({ _id: body.scanId }).select("_id images")); // find scan
    err = toResponse[0];
    scan = toResponse[1];

    if (err) {
        console.log("Error: while finding scan.");
        console.log(err);
        log.error("Error: while finding scan.");
        log.error(err);
        return ReE(res, err, 422);
    }
    if (!scan) {
        return ReE(res, "Scan not found", 404);
    }

    scan = scan.toWeb(); // convert scan to json
    if (!scan.images) {
        scan['images'] = body.images;
    } else {
        scan.images = scan.images.concat(body.images);
    }


    toResponse = await to(ScanHistory.updateOne({ _id: scan._id }, { images: scan.images })); // update scan
    err = toResponse[0];
    scan = toResponse[1];
    if (err) {
        console.log("Error: while saving scan.");
        console.log(err);
        log.error("Error: while saving scan.");
        log.error(err);
        return ReE(res, err, 422);
    }
    ReS(res, scan, 200, "Successfully added images to scan"); // send response
}
module.exports.addImagesToScan = addImagesToScan;

const getReclassificaitonData = async function (req, res) {
    const body = req.body; // get request body
    let err, reports; // declare variables
    let toResponse = [null, null]; // declare await to response array
    if (!body.id || body.id === "") {
        return ReE(res, "Invalid request", 422);
    }
    toResponse = await to(ScanImages.findOne({ _id: body.id }).select("_id report")); // find scan
    err = toResponse[0];
    reports = toResponse[1];
    if (err) {
        console.log("Error: while finding reclassification data.");
        console.log(err);
        log.error("Error: while finding reclassification data.");
        log.error(err);
        return ReE(res, err, 422);
    }
    if (!reports) {
        return ReE(res, "Scan not found", 404);
    }
    reports.report = reports.report.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    for (let i = 0; i < reports.report.length; i++) {
        // check if reclassifiedImages is present in the report
        if (reports.report[i].reclassifiedImages !== undefined && reports.report[i].reclassifiedImages.length > 0) {
            reports.report[i].reclassifiedImages = reports.report[i].reclassifiedImages.map(image => {
                let imageName = null;
                if (image['path']) {
                    imageName = image['path'].split("/").pop();
                    image['imageName'] = imageName;
                }
                return image
            });
        }
    }
    return ReS(res, reports, 200, "Successfully retrieved reclassification data"); // send response
}
module.exports.getReclassificaitonData = getReclassificaitonData;

const getReport = function (scan, oldReport) {
    let reportClasses = oldReport.map(classObj => {
        return {
            className: classObj.className,
            count: 0,
            percentage: 0
        }
    });
    // images to the respective classes
    for (let image of scan.images) {
        classNumber = reportClasses.findIndex(cls => cls.className === image.class);
        if (classNumber === -1) {
            reportClasses.push({ className: image.class, count: 0, percentage: 0 });
            classNumber = reportClasses.length - 1;
        }
        reportClasses[classNumber].count++;

    }

    totalImages = scan.images.length; // get total images
    totalClasses = reportClasses.length; // get total classes

    // calculate percentage
    for (let i = 0; i < totalClasses; i++) {
        reportClasses[i]['percentage'] = (reportClasses[i].count / totalImages) * 100;
        // round percentage to 2 decimal places
        reportClasses[i]['percentage'] = Math.round(reportClasses[i].percentage * 100) / 100;
    }
    let report = {
        details: reportClasses
    }
    return report;

}

const reclassify = async function (req, res) {
    const body = req.body; // get request body
    let err, scanImages, data, scan, response; // declare variables
    let toResponse = [null, null]; // declare await to response array
    let reclassifiedImages = [];
    let isReclassified = false;
    let requiredFields = [
        "id", // check if required fields are present in request body
        "reclassification"
    ];
    for (let field of requiredFields) {
        if (!body[field]) {
            console.log("Error: " + field + " not found.");
            log.info(field + " not found.");
            return ReE(res, field + " not found.", 422);
        }
    }
    // fetch the document from the database
    toResponse = await to(ScanImages.findOne({ _id: body.id }).select("-updatedAt")); // find scan
    err = toResponse[0];
    scanImages = toResponse[1];
    if (err) {
        console.log("Error: while finding scan.");
        console.log(err);
        log.error("Error: while finding scan.");
        log.error(err);
        return ReE(res, err, 422);
    }
    if (!scanImages) {
        return ReE(res, "Scan not found", 404);
    }
    if (scanImages.images.length === 0) {
        return ReE(res, "No images found in scan", 404);
    }

    imageIndexes = [];
    reclassification = body.reclassification;
    len = scanImages.images.length;
    for (let i = 0; i < len; i++) {
        if (reclassification.length === 0) {
            break;
        }
        index = reclassification.findIndex(image => image.id === scanImages.images[i]._id.toString());
        image = body.reclassification[index];
        if (index !== -1 && scanImages.images[i].class !== image.class) {
            reclassifiedImages.push({
                _id: scanImages.images[i]._id,
                previousClass: scanImages.images[i].class,
                currentClass: image.class,
                path: scanImages.images[i].path
            });
            scanImages.images[i].reclassificationHistory.push({ previousClass: scanImages.images[i].class, currentClass: image.class });
            scanImages.images[i].class = image.class;
            reclassification.splice(index, 1);
            isReclassified = true;
        }
    }
    if (!isReclassified) {
        return ReE(res, "No images reclassified", 404);
    }
    oldReport = scanImages.report[scanImages.report.length - 1]['details'];
    let newReport = getReport(scanImages, oldReport);
    newReport['reclassifiedImages'] = reclassifiedImages;
    // update the document in the database and return the updated document
    toResponse = await to(ScanImages.findOneAndUpdate({ _id: body.id }, { images: scanImages.images, $push: { report: newReport } }, { returnDocument: 'after' }));
    err = toResponse[0];
    if (err) {
        console.log("Error: while reclassifying images in scan.");
        console.log(err);
        log.error("Error: while reclassifying images in scan.");
        log.error(err);
        return ReE(res, err, 422);
    }
    response = toResponseFormat(toResponse[1], newReport.details);
    toResponse = await to(ScanHistory.updateOne({ _id: body.id }, { $inc: { numberOfReclassifications: 1 } }, { returnDocument: 'after' }));
    err = toResponse[0];
    if (err) {
        console.log("Error: while updating scan history.");
        console.log(err);
        log.error("Error: while updating scan history.");
        log.error(err);
        return ReE(res, err, 422);
    }


    return ReS(res, response, 200, "Successfully reclassified images in scan"); // send response
}
module.exports.reclassify = reclassify;

