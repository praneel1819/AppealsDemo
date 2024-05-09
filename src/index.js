const express = require('express');
const https = require('https');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const port = 4000;


// Enumerated values for appeal types
const AppealStatus = {
    RECEIVED: 'Received',
    ACKNOWLEDGED: 'Acknowledged',
    INREVIEW: 'Inreview',
	Approved: 'Approved',
    Rejected: 'Rejected',
    APPROVEDLOWERAMT: 'Approvedloweramt'
};

class Appeal {
    constructor(appealId, claimId, memberId, patientName, appealReason, procedureCode, physicianName, physicianId, submissionDate, status) {
        this.appealId = appealId;
        this.claimId = claimId;
        this.memberId = memberId;
        this.patientName = patientName;
		this.appealReason = appealReason;
        this.procedureCode = procedureCode;
        this.physicianName = physicianName;
        this.physicianId = physicianId;
        this.submissionDate = submissionDate;
        this.status = status;
    }
}


class ValidationResponse {
    constructor(appealId, claimId, memberId, patientName, appealReason, procedureCode, physicianName, physicianId, submissionDate, status, groupNumber, providerName, serviceDate, claimAmount, adjudicatedAmount, claimStatus, claimProcedureCode, validationResponse) {
        this.appealId = appealId;
        this.claimId = claimId;
        this.memberId = memberId;
        this.patientName = patientName;
        this.appealReason = appealReason;
        this.procedureCode = procedureCode;
        this.physicianName = physicianName;
        this.physicianId = physicianId;
        this.submissionDate = submissionDate;
        this.status = status;
        this.groupNumber = groupNumber;
        this.providerName = providerName;
        this.serviceDate = serviceDate;
        this.claimAmount = claimAmount;
        this.adjudicatedAmount = adjudicatedAmount;
        this.claimStatus = claimStatus;
        this.claimProcedureCode = claimProcedureCode;
        this.validationResponse = validationResponse;
    }
}

class Appeals {
    constructor() {
        this.appealList = [];
    }

    getAppealList() {
        return this.appealList;
    }

    getAppealById(appealId) {
        return this.appealList.find(appeal => appeal.appealId === appealId);
    }

    getAppealsByStatus(status) {
        return this.appealList.filter(appeal => appeal.status === status);
    }

    addAppeal(appeal) {
        this.appealList.push(appeal);
    }

    updateAppealById(appealId, updatedData) {
        const index = this.appealList.findIndex(appeal => appeal.appealId === appealId);

        if (index !== -1) {
            this.appealList[index] = { ...this.appealList[index], ...updatedData };
            return true; // Indicate successful update
        }

        return false; // Indicate appeal with specified ID not found
    }

    deleteAppeal(appealId) {
        this.appealList = this.appealList.filter(appeal => appeal.appealId !== appealId);
    }

    validateAppeal(appealId) {
        const appeal = this.getAppealById(appealId);

        if (appeal) {
            // Implement your validation logic here
            const validationResponse = "Validation triggered. The appeal is valid, however not able to validate procedure Codes";

            // Set the response attribute in the appeal
            appeal.ValidateResponse = validationResponse;

            return { success: true, response: validationResponse };
        } else {
            return { success: false, response: "Appeal not found" };
        }
    }

    ackLetterAppeal(appealId) {
        const appeal = this.getAppealById(appealId);

        if (appeal) {
            // Implement your acknowledgement logic here
            //const ackLetterResponse = "This letter is to inform you that we received your appeal for your Claim ID: 10901 for your visit to Memorial Hospital on 01/04/2024 disputing the action taken by related to procedure code : CPT 23455.";
            const ackLetterResponse = "This letter is to inform you that we received your appeal for your Claim ID: " + appeal.claimId +" for your visit to Memorial Hospital on 01/04/2024 disputing the action taken by related to procedure code : " +appeal.procedureCode;

            // Set the response attribute in the appeal
            appeal.AckLetterResponse = ackLetterResponse;

            return { success: true, response: ackLetterResponse };
        } else {
            return { success: false, response: "Appeal not found" };
        }
    }

    validateAppealWithDetails(appealId) {
        const appeal = this.getAppealById(appealId);
        if (!appeal) {
            return { success: false, response: "Appeal not found" };
        }
    
        const benefit = benefits.getBenefitByAppealId(appealId);
        const claim = claims.getClaimByAppealId(appealId);
    
        if (!benefit || !claim) {
            return { success: false, response: "Benefit or Claim not found for the specified Appeal" };
        }
    
        let validationResponse;
        // Check if procedure codes match
        if (appeal.procedureCode !== claim.procedureCode) {
            validationResponse = new ValidationResponse(
            appeal.appealId, claim.claimId, appeal.memberId, appeal.patientName, appeal.appealReason,
            appeal.procedureCode, appeal.physicianName, appeal.physicianId,
            appeal.submissionDate, appeal.status, claim.groupNumber, claim.providerName,
            claim.serviceDate, claim.claimAmount, claim.adjudicatedAmount, claim.claimStatus,
            claim.procedureCode,
            "Validation failed because Procedure codes DO NOT match in claim info.");
		} else {
            validationResponse = new ValidationResponse(
            appeal.appealId, claim.claimId, appeal.memberId, appeal.patientName, appeal.appealReason,
            appeal.procedureCode, appeal.physicianName, appeal.physicianId,
            appeal.submissionDate, appeal.status, claim.groupNumber, claim.providerName,
            claim.serviceDate, claim.claimAmount, claim.adjudicatedAmount, claim.claimStatus,
            claim.procedureCode,
            "Validation successful, Procedure codes match with the claims info");
        }
    
        return { success: true, response: validationResponse };
    }
	
}

const appeals = new Appeals();


class Benefit {
    constructor(appealId, benefitId, groupNumber, memberId, patientName, effectiveFrom, effectiveTo, providerName, payerNetworkId, planId, primaryCarePhysician, coverageType, copay, deductible, activeStatus) {
        this.appealId = appealId;
        this.benefitId = benefitId;
        this.groupNumber = groupNumber;
        this.memberId = memberId;
        this.patientName = patientName;
        this.effectiveFrom = effectiveFrom;
        this.effectiveTo = effectiveTo;
        this.providerName = providerName;
        this.payerNetworkId = payerNetworkId;
        this.planId = planId;
        this.primaryCarePhysician = primaryCarePhysician;
        this.coverageType = coverageType;
        this.copay = copay;
        this.deductible = deductible;
        this.activeStatus = activeStatus;
    }
}

class Benefits {
    constructor() {
        this.benefitList = [];
    }

    getBenefitList() {
        return this.benefitList;
    }

    getBenefitById(memberId) {
        return this.benefitList.find(benefit => benefit.memberId === memberId);
    }

    getBenefitByAppealId(appealId) {
        return this.benefitList.find(benefit => benefit.appealId === appealId);
    }

    addBenefit(benefit) {
        this.benefitList.push(benefit);
    }

    deleteBenefit(memberId) {
        this.benefitList = this.benefitList.filter(benefit => benefit.memberId !== memberId);
    }
    
}

const benefits = new Benefits();

class Claim {
    constructor(appealId, claimId, groupNumber, memberId, patientName, providerName, adjudicatedAmount, procedureCode, claimAmount, claimStatus, serviceDate) {
        this.appealId = appealId;
        this.claimId = claimId;
        this.groupNumber = groupNumber;
        this.memberId = memberId;
        this.patientName = patientName;
        this.providerName = providerName;
        this.adjudicatedAmount = adjudicatedAmount;
        this.procedureCode = procedureCode;
        this.claimAmount = claimAmount;
        this.claimStatus = claimStatus;
        this.serviceDate = serviceDate;
    }
}

class Claims {
    constructor() {
        this.claimList = [];
    }

    getClaimList() {
        return this.claimList;
    }

    getClaimById(claimId) {
        return this.claimList.find(claim => claim.claimId === claimId);
    }

    getClaimByAppealId(appealId) {
        return this.claimList.find(claim => claim.appealId === appealId);
    }

    addClaim(claim) {
        this.claimList.push(claim);
    }

    deleteClaim(claimId) {
        this.claimList = this.claimList.filter(claim => claim.claimId !== claimId);
    }
}

const claims = new Claims();

app.use(bodyParser.json());


/**
 * @swagger
 * components:
 *   schemas:
 *     Appeal:
 *       type: object
 *       properties:
 *         appealId:
 *           type: integer
 *         claimId:
 *           type: integer
 *         memberId:
 *           type: integer
 *         patientName:
 *           type: string
 *         appealReason:
*            type: string
 *         procedureCode:
 *           type: string
 *         physicianName:
 *           type: string
 *         physicianId:
 *           type: integer
 *         submissionDate:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *           enum: [Received, Acknowledged, In-review, Approved, Rejected, 'Approvedloweramt']
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ValidationResponse:
 *       type: object
 *       properties:
 *         appealId:
 *           type: integer
 *           description: The ID of the appeal.
 *         claimId:
 *           type: integer
 *           description: The ID of the claim.
 *         memberId:
 *           type: integer
 *           description: The ID of the member.
 *         patientName:
 *           type: string
 *           description: The name of the patient.
 *         appealReason:
 *           type: string
 *           description: The reason for the appeal.
 *         procedureCode:
 *           type: string
 *           description: The procedure code from the appeal object.
 *         physicianName:
 *           type: string
 *           description: The name of the physician from the appeal object.
 *         physicianId:
 *           type: integer
 *           description: The ID of the physician from the appeal object.
 *         submissionDate:
 *           type: string
 *           format: date
 *           description: The submission date of the appeal.
 *         status:
 *           type: string
 *           enum: [Received, Acknowledged, In-review, Approved, Rejected, Approvedloweramt]
 *           description: The status of the appeal.
 *         groupNumber:
 *           type: integer
 *           description: The group number associated with the claim.
 *         providerName:
 *           type: string
 *           description: The name of the provider associated with the claim.
 *         serviceDate:
 *           type: string
 *           format: date
 *           description: The service date of the claim.
 *         claimAmount:
 *           type: string
 *           description: The claim amount.
 *         adjudicatedAmount:
 *           type: string
 *           description: The adjudicated amount of the claim.
 *         claimStatus:
 *           type: string
 *           description: The status of the claim.
 *         claimProcedureCode:
 *           type: string
 *           description: The procedure code from the claim object.
 *         validationResponse:
 *           type: string
 *           description: The validation response message.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Benefit:
 *       type: object
 *       properties:
 *         appealId:
 *           type: integer
 *         benefitId:
 *           type: integer
 *         groupNumber:
 *           type: integer
 *         memberId:
 *           type: integer
 *         patientName:
 *           type: string
 *         effectiveFrom:
 *           type: string
 *           format: date
 *         effectiveTo:
 *           type: string
 *           format: date
 *         providerName:
 *           type: string
 *         payerNetworkId:
 *           type: string
 *         planId:
 *           type: string
 *         primaryCarePhysician:
 *           type: string
 *         coverageType:
 *           type: string
 *         copay:
 *           type: string
 *         deductible:
 *           type: string
 *         activeStatus:
 *           type: string
 */


/**
 * @swagger
 * tags:
 *   name: Appeals
 *   description: Operations related to appeals
 */


/**
 * @swagger
 * /appeals:
 *   get:
 *     summary: Get all appeals
 *     tags:
 *       - Appeals
 *     responses:
 *       200:
 *         description: Successful response
 */

// GET all appeals
app.get('/appeals', (req, res) => {
    res.json(appeals.getAppealList());
});

/**
 * @swagger
 * /appeals/{appealId}:
 *   get:
 *     summary: Get a appeal by ID
 *     tags:
 *       - Appeals
 *     parameters:
 *       - in: path
 *         name: appealId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successful response
 *       404:
 *         description: Appeal not found
 */

// GET appeal by ID
app.get('/appeals/:appealId', (req, res) => {
    const appealId = parseInt(req.params.appealId);
    const appeal = appeals.getAppealById(appealId);

    if (appeal) {
        res.json(appeal);
    } else {
        res.status(404).json({ error: 'Appeal not found' });
    }
});

/**
  * @swagger
 * /appeals/details/{appealId}:
 *   get:
 *     summary: Validates an appeal with detailed information.
 *     tags: [Appeals]
 *     parameters:
 *       - in: path
 *         name: appealId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationResponse'
 *       '404':
 *         description: Appeal, Benefit, or Claim not found
 */
app.get('/appeals/details/:appealId', (req, res) => {
    const appealId = parseInt(req.params.appealId);

    const result = appeals.validateAppealWithDetails(appealId);

    if (result.success) {
        res.json(result.response);
    } else {
        res.status(404).json({ success: false, error: result.response });
    }
});

/**
 * @swagger
 * /appeals/status/{status}:
 *   get:
 *     summary: Get appeals by status
 *     tags:
 *       - Appeals
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Received, Acknowledged, In-review, Approved, Rejected, Approvedloweramt]
 *     responses:
 *       '200':
 *         description: Successful response
 *       '404':
 *         description: No appeals found for the specified status
 */

// GET appeals by status
app.get('/appeals/status/:status', (req, res) => {
    const requestedStatus = req.params.status;

    // Validate the requested status
    const validStatusValues = ['Received', 'Acknowledged', 'In-review', 'Approved', 'Rejected', 'Approvedloweramt'];

    if (!validStatusValues.includes(requestedStatus)) {
        return res.status(400).json({
            error: 'Invalid request. Please provide a valid status value: Received, Acknowledged, In-review, Approved, Rejected, Approved with lower amount.'
        });
    }

    // Filter appeals by status
    const appealsByStatus = appeals.getAppealList().filter(appeal => appeal.status === requestedStatus);

    if (appealsByStatus.length > 0) {
        res.json(appealsByStatus);
    } else {
        res.status(404).json({ error: 'No appeals found for the specified status' });
    }
});

/**
 * @swagger
 * /appeals:
 *   post:
 *     summary: Create a new appeal
 *     tags: [Appeals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appeal'
 *     responses:
 *       200:
 *         description: Successful response
 *       400:
 *         description: Invalid request
 */
// POST (create) a new appeal
app.post('/appeals', (req, res) => {
    const {
        appealId,
        claimId,
        memberId,
        patientName,
		appealReason,
        procedureCode,
        physicianName,
        physicianId,
        submissionDate,
        status
    } = req.body;

    // Validate the appeal status
    const validStatusValues = ['Received', 'Acknowledged', 'In-review', 'Approved', 'Rejected', 'Approvedloweramt'];

    if (
        appealId &&
        claimId &&
        memberId &&
        patientName &&
		appealReason &&
        procedureCode &&
        physicianName &&
        physicianId &&
        submissionDate &&
        status &&
        validStatusValues.includes(status)
    ) {
        const newAppeal = new Appeal(
            appealId,
            claimId,
            memberId,
            patientName,
			appealReason,
            procedureCode,
            physicianName,
            physicianId,
            submissionDate,
            status
        );
        appeals.addAppeal(newAppeal);

        res.json(newAppeal);
    } else {
        res.status(400).json({
            error:
                'Invalid request. Please provide all required fields (appealId, claimId, memberId, patientName, patientName, appealReason, procedureCode, physicianName, physicianId, submissionDate, status), and ensure status is one of: Received, Acknowledged, In-review, Approved, Rejected, Approved with lower amount.'
        });
    }
});

/**
 * @swagger
 * /appeals/{appealId}:
 *   put:
 *     summary: Update a specific appeal by ID
 *     tags: [Appeals]
 *     parameters:
 *       - in: path
 *         name: appealId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Appeal'
 *     responses:
 *       '200':
 *         description: Successful response
 *       '400':
 *         description: Invalid request
 *       '404':
 *         description: Appeal not found
 */

// PUT (update) an appeal by ID
app.put('/appeals/:appealId', (req, res) => {
    const appealId = parseInt(req.params.appealId);
    const {
        claimId,
        memberId,
        patientName,
		appealReason,
        procedureCode,
        physicianName,
        physicianId,
        submissionDate,
        status
    } = req.body;

    // Validate the appeal status
    const validStatusValues = ['Received', 'Acknowledged', 'In-review', 'Approved', 'Rejected', 'Approvedloweramt'];

    if (!appeals.getAppealById(appealId)) {
        return res.status(404).json({ error: 'Appeal not found' });
    }

    if (
        claimId &&
        memberId &&
        patientName &&
		appealReason &&
        procedureCode &&
        physicianName &&
        physicianId &&
        submissionDate &&
        status &&
        validStatusValues.includes(status)
    ) {
        const updatedAppeal = new Appeal(
            appealId,
            claimId,
            memberId,
            patientName,
			appealReason,
            procedureCode,
            physicianName,
            physicianId,
            submissionDate,
            status
        );

        // Find the index of the existing appeal in the list
        const index = appeals.getAppealList().findIndex(appeal => appeal.appealId === appealId);

        // Update the appeal in the list
        appeals.getAppealList()[index] = updatedAppeal;

        res.json(updatedAppeal);
    } else {
        res.status(400).json({
            error:
                'Invalid request. Please provide all required fields (claimId, memberId, patientName, appealReason, procedureCode, physicianName, physicianId, submissionDate, status), and ensure status is one of: Received, Acknowledged, In-review, Approved, Rejected, Approved with lower amount.'
        });
    }
});

/**
 * @swagger
 * /appeals/{appealId}:
 *   delete:
 *     summary: Delete a appeal by ID
 *     tags: [Appeals]
 *     parameters:
 *       - in: path
 *         name: appealId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Appeal deleted successfully
 *       404:
 *         description: Appeal not found
 */

// DELETE appeal by ID
app.delete('/appeals/:appealId', (req, res) => {
    const appealId = parseInt(req.params.appealId);
    const appeal = appeals.getAppealById(appealId);

    if (appeal) {
        appeals.deleteAppeal(appealId);
        res.json({ message: 'Appeal deleted successfully' });
    } else {
        res.status(404).json({ error: 'Appeal not found' });
    }
});

/**
 * @swagger
 * /appeals/validate/{appealId}:
 *   get:
 *     summary: Validate an appeal by ID
 *     tags: [Appeals]
 *     parameters:
 *       - in: path
 *         name: appealId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 response:
 *                   type: string
 *       '404':
 *         description: Appeal not found
 */
// GET validate an appeal by ID
app.get('/appeals/validate/:appealId', (req, res) => {
    const appealId = parseInt(req.params.appealId);
    const result = appeals.validateAppeal(appealId);

    if (result.success) {
        res.json({ success: true, response: result.response });
    } else {
        res.status(404).json({ success: false, error: result.response });
    }
});

/**
 * @swagger
 * /appeals/ackLetter/{appealId}:
 *   get:
 *     summary: AckLetter of an appeal by ID
 *     tags: [Appeals]
 *     parameters:
 *       - in: path
 *         name: appealId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 response:
 *                   type: string
 *       '404':
 *         description: Appeal not found
 */
// GET ackLetter of an appeal by ID
app.get('/appeals/ackLetter/:appealId', (req, res) => {
    const appealId = parseInt(req.params.appealId);
    const result = appeals.ackLetterAppeal(appealId);

    if (result.success) {
        res.json({ success: true, response: result.response });
    } else {
        res.status(404).json({ success: false, error: result.response });
    }
});


/**
 * @swagger
 * tags:
 *   name: Benefits
 *   description: Operations related to benefits
 */

/**
 * @swagger
 * /benefits:
 *   get:
 *     summary: Get all benefits
 *     tags:
 *       - Benefits
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Benefit'
 */

// GET all benefits
app.get('/benefits', (req, res) => {
    res.json(benefits.getBenefitList());
});

/**
 * @swagger
 * /benefits/{memberId}:
 *   get:
 *     summary: Get a benefit by ID
 *     tags:
 *       - Benefits
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Benefit'
 *       '404':
 *         description: Benefit not found
 */

// GET benefit by ID
app.get('/benefits/:memberId', (req, res) => {
    const memberId = parseInt(req.params.memberId);
    const benefit = benefits.getBenefitById(memberId);

    if (benefit) {
        res.json(benefit);
    } else {
        res.status(404).json({ error: 'Benefit not found' });
    }
});

/**
 * @swagger
 * /benefits:
 *   post:
 *     summary: Create a new benefit
 *     tags: [Benefits]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Benefit'
 *     responses:
 *       '200':
 *         description: Successful response
 *       '400':
 *         description: Invalid request
 */

// POST (create) a new benefit
app.post('/benefits', (req, res) => {
    const {
        appealId,
        benefitId,
        groupNumber,
        memberId,
        patientName,
        effectiveFrom,
        effectiveTo,
        providerName,
        payerNetworkId,
        planId,
        primaryCarePhysician,
        coverageType,
        copay,
        deductible,
        activeStatus
    } = req.body;

    if (
        appealId &&
        benefitId &&
        groupNumber &&
        memberId &&
        patientName &&
        effectiveFrom &&
        effectiveTo &&
        providerName &&
        payerNetworkId &&
        planId &&
        primaryCarePhysician &&
        coverageType &&
        copay &&
        deductible &&
        activeStatus
    ) {
        const newBenefit = new Benefit(
            appealId,
            benefitId,
            groupNumber,
            memberId,
            patientName,
            effectiveFrom,
            effectiveTo,
            providerName,
            payerNetworkId,
            planId,
            primaryCarePhysician,
            coverageType,
            copay,
            deductible,
            activeStatus
        );
        benefits.addBenefit(newBenefit);

        res.json(newBenefit);
    } else {
        res.status(400).json({
            error: 'Invalid request. Please provide all required fields.'
        });
    }
});

/**
 * @swagger
 * /benefits/{memberId}:
 *   delete:
 *     summary: Delete a benefit by ID
 *     tags: [Benefits]
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Benefit deleted successfully
 *       '404':
 *         description: Benefit not found
 */

// DELETE benefit by ID
app.delete('/benefits/:memberId', (req, res) => {
    const memberId = parseInt(req.params.memberId);
    const benefit = benefits.getBenefitById(memberId);

    if (benefit) {
        benefits.deleteBenefit(memberId);
        res.json({ message: 'Benefit deleted successfully' });
    } else {
        res.status(404).json({ error: 'Benefit not found' });
    }
});
 
/**
 * @swagger
 * tags:
 *   name: Claims
 *   description: Operations related to claims
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Claim:
 *       type: object
 *       properties:
 *         appealId:
 *           type: integer
 *         claimId:
 *           type: integer
 *         groupNumber:
 *           type: integer
 *         memberId:
 *           type: integer
 *         patientName:
 *           type: string
 *         providerName:
 *           type: string
 *         adjudicatedAmount:
 *           type: string
 *         procedureCode:
 *           type: string
 *         claimAmount:
 *           type: string
 *         claimStatus:
 *           type: string
 *         serviceDate:
 *           type: string
 */

/**
 * @swagger
 * /claims:
 *   get:
 *     summary: Get all claims
 *     tags:
 *       - Claims
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Claim'
 */

// GET all claims
app.get('/claims', (req, res) => {
    res.json(claims.getClaimList());
});

/**
 * @swagger
 * /claims/{claimId}:
 *   get:
 *     summary: Get a claim by ID
 *     tags:
 *       - Claims
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Claim'
 *       '404':
 *         description: Claim not found
 */

// GET claim by ID
app.get('/claims/:claimId', (req, res) => {
    const claimId = parseInt(req.params.claimId);
    const claim = claims.getClaimById(claimId);

    if (claim) {
        res.json(claim);
    } else {
        res.status(404).json({ error: 'Claim not found' });
    }
});

/**
 * @swagger
 * /claims:
 *   post:
 *     summary: Create a new claim
 *     tags: [Claims]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Claim'
 *     responses:
 *       '200':
 *         description: Successful response
 *       '400':
 *         description: Invalid request
 */

// POST (create) a new claim
app.post('/claims', (req, res) => {
    const {
        appealId,
        claimId,
        groupNumber,
        memberId,
        patientName,
        providerName,
        adjudicatedAmount,
        procedureCode,
        claimAmount,
        claimStatus,
        serviceDate
    } = req.body;

    if (
        appealId &&
        claimId &&
        groupNumber &&
        memberId &&
        patientName &&
        providerName &&
        adjudicatedAmount &&
        procedureCode &&
        claimAmount &&
        claimStatus &&
        serviceDate
    ) {
        const newClaim = new Claim(
            appealId,
            claimId,
            groupNumber,
            memberId,
            patientName,
            providerName,
            adjudicatedAmount,
            procedureCode,
            claimAmount,
            claimStatus,
            serviceDate
        );
        claims.addClaim(newClaim);

        res.json(newClaim);
    } else {
        res.status(400).json({
            error: 'Invalid request. Please provide all required fields.'
        });
    }
});

/**
 * @swagger
 * /claims/{claimId}:
 *   delete:
 *     summary: Delete a claim by ID
 *     tags: [Claims]
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Claim deleted successfully
 *       '404':
 *         description: Claim not found
 */

// DELETE claim by ID
app.delete('/claims/:claimId', (req, res) => {
    const claimId = parseInt(req.params.claimId);
    const claim = claims.getClaimById(claimId);

    if (claim) {
        claims.deleteClaim(claimId);
        res.json({ message: 'Claim deleted successfully' });
    } else {
        res.status(404).json({ error: 'Claim not found' });
    }
});


const privateKey = fs.readFileSync('./certificates/server.key', 'utf8');
const certificate = fs.readFileSync('./certificates/server.cert', 'utf8');
const credentials = {
    key: privateKey,
    cert: certificate,
    passphrase: 'AvyaanIshva@1401'  // Replace with the actual passphrase
};

const { swaggerUi, specs } = require('../openapi');

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

const httpsServer = https.createServer(credentials, app);


httpsServer.listen(port, () => {
    console.log(`Server is running on https://localhost:${port}`);
});
