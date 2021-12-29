import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { getDescribeGraph, getGraphInfo, getAliasesForPubkeys, getGraphNode, getGraphEdge, getRemoteFeePolicy, getQueryRoutes } from '../../controllers/lnd/graph.js';

const router = Router();

router.get('/', isAuthenticated, getDescribeGraph);
router.get('/info', isAuthenticated, getGraphInfo);
router.get('/nodes', isAuthenticated, getAliasesForPubkeys);
router.get('/node/:pubKey', isAuthenticated, getGraphNode);
router.get('/edge/:chanid', isAuthenticated, getGraphEdge);
router.get('/edge/:chanid/:localPubkey', isAuthenticated, getRemoteFeePolicy);
router.get('/routes/:destPubkey/:amount', isAuthenticated, getQueryRoutes);

export default router;
