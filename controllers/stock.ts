import { Router, Request, Response } from 'express';
import * as queue from 'express-queue'
import * as timeout from 'express-timeout-handler'
import * as cors from 'cors'
import * as bodyParser from 'body-parser'
import * as loki from 'lokijs'

const router: Router = Router();
const db = new loki('db.json');
const availabilityTable = db.addCollection('availability');

const options = {
    timeout: 300000,

    onTimeout: function (req: Request, res: Response) {
        res.status(503).send('Service unavailable. Please retry.');
    }
};

router.use(cors());
// router.use(bodyParser.json());
router.use(bodyParser.json({ limit: '50mb' }));
router.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
router.use(queue({ activeLimit: 1, queuedLimit: -1 }));
router.use(timeout.handler(options));

router.get('/', (req: Request, res: Response) => {
    return res.status(501).send();
});

router.get('/:bookId', (req: Request, res: Response) => {
    let availability = availabilityTable.findOne({ bookId: parseInt(req.params.bookId) });
    // if (!availability) {
    //     return res.status(404).send();
    // }
    return res.status(200).send(availability);
});

router.post('/', (req: Request, res: Response) => {
    // if (availabilityTable.find({ bookId: parseInt(req.body.bookId) }).length > 0) {
    //     return res.status(409).send();
    // }
    availabilityTable.insert(req.body);
    return res.status(201).send();
});

router.put('/', (req: Request, res: Response) => {
    let availability = availabilityTable.findOne({ bookId: parseInt(req.body.bookId) });
    // if (!availability) {
    //     return res.status(404).send();
    // }
    availability.stock = req.body.stock;
    availabilityTable.update(availability);
    return res.status(204).send();
});

router.delete('/:bookId', (req: Request, res: Response) => {
    let availability = availabilityTable.findOne({ bookId: parseInt(req.params.bookId) });
    // if (!availability) {
    //     return res.status(404).send();
    // }
    availabilityTable.remove(availability);
    return res.status(200).send();
});

router.put('/:bookId/devolution', (req: Request, res: Response) => {
    let availability = availabilityTable.findOne({ bookId: parseInt(req.params.bookId) });
    // if (!availability) {
    //     return res.status(404).send();
    // }
    availability.stock = availability.stock + 1;
    availabilityTable.update(availability);
    return res.status(204).send();
});
router.put('/:bookId/loan', (req: Request, res: Response) => {
    let availability = availabilityTable.findOne({ bookId: parseInt(req.params.bookId) });
    // if (!availability) {
    //     return res.status(404).send();
    // }
    let newAvailability = availability.stock - 1;
    if(newAvailability <= 0){
        return res.status(401).send();
    }
    availability.stock = newAvailability;
    availabilityTable.update(availability);
    return res.status(204).send();
});


export const StockController: Router = router;