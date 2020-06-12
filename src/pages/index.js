import styles from './index.css';
import { Component } from 'react';
import { Statistic, Table, Row, Col } from 'antd';
import { getWeb3, isSwitchFinish } from '../conf/web3switch';
import sleep from 'ko-sleep';
import { scAddress } from '../conf/config';
import abi from '../conf/lottery.json';

class Index extends Component {

  colum = [
    {
      title: 'name',
      dataIndex: 'name',
      key: 'name',
    },
    // {
    //   title: 'Capacity',
    //   dataIndex: 'capacity',
    //   key: 'capacity',
    // },
    // {
    //   title: 'FeeRate',
    //   dataIndex: 'feeRate',
    //   key: 'feeRate',
    // },
    {
      title: 'Delegated Amount',
      dataIndex: 'delegatedAmount',
      key: 'delegatedAmount',
    },
  ]

  validators = [
    {
      name: 'WANBr',
      address: '0x1f45cad3c17ced4d7596a5b40280a3f024b971f4',
    },
    {
      name: 'WAN.CN',
      address: '0xd058aa0522de5f3cfac539cb8d270d6e570c717d',
    },
    {
      name: 'WanPie',
      address: '0xe8ba6366e156c247aa1f39187e549c6cfee7ffeb',
    },
    {
      name: 'Zhejiang(浙江)',
      address: '0x0288c83219701766197373d1149f616c62b52a7d',
    },
    {
      name: 'Bitrue',
      address: '0x89d91c8a8a17b6c9ebeadcb6dcc1bac664335186',
    }
  ]

  constructor(props) {
    super(props);

    this.state = {
      blockNumber: 0,
      totalPool: 0,
      delegatePool: 0,
      demandDepositPool: 0,
      pricePool: 0,
      stakeCounts: 0,
      redeemCounts: 0,
      lotterySettlementCounts: 0,
      winCounts: 0,
      subsidyAmount: 0,
      tableData: [],
    }
  }

  async componentWillMount(props) {
    while (true) {
      if (isSwitchFinish()) {
        break;
      }
      await sleep(100);
    }
    let web3 = getWeb3();
    let sc = new web3.eth.Contract(abi, scAddress);
    let funcs = [];
    funcs.push(web3.eth.getBlockNumber());
    funcs.push(sc.methods.poolInfo().call());
    funcs.push(sc.getPastEvents('Buy', { fromBlock: 8865321 }));
    funcs.push(sc.getPastEvents('Redeem', { fromBlock: 8865321 }));
    funcs.push(sc.getPastEvents('LotteryResult', { fromBlock: 8865321 }));
    funcs.push(sc.methods.subsidyInfo().call());

    const [blockNumber, poolInfo, buyEvents, redeemEvents, settleEvents, subsidyInfo] = await Promise.all(funcs);

    funcs = [];

    console.log(blockNumber, poolInfo, buyEvents, redeemEvents, settleEvents, subsidyInfo);
    let winCounts = 0;
    for (let i = 0; i < settleEvents.length; i++) {
      if (settleEvents[i].amounts.length > 0 && Number(settleEvents[i].amounts[0]) > 0) {
        winCounts++;
      }
    }

    let tableData = [];
    for (let i = 0; i < this.validators.length; i++) {
      funcs.push(sc.methods.validatorsAmountMap(this.validators[i].address).call());
    }

    let rets = await Promise.all(funcs);
    for (let i = 0; i < this.validators.length; i++) {
      tableData.push({
        key: i,
        name: this.validators[i].name,
        capacity: '--',
        feeRate: '--',
        delegatedAmount: web3.utils.fromWei(rets[i])
      });
    }

    this.setState({
      blockNumber,
      totalPool: Number(web3.utils.fromWei(poolInfo.delegatePool)) + Number(web3.utils.fromWei(poolInfo.demandDepositPool)) + Number(web3.utils.fromWei(poolInfo.prizePool)),
      delegatePool: Number(web3.utils.fromWei(poolInfo.delegatePool)),
      demandDepositPool: Number(web3.utils.fromWei(poolInfo.demandDepositPool)),
      pricePool: Number(web3.utils.fromWei(poolInfo.prizePool)),
      stakeCounts: buyEvents.length,
      redeemCounts: redeemEvents.length,
      lotterySettlementCounts: settleEvents.length,
      winCounts,
      subsidyAmount: Number(web3.utils.fromWei(subsidyInfo.total)),
      tableData
    })
  }

  render() {
    return (
      <div className={styles.app + ' ' + styles.inline}>
        <div>
          <div className={styles.inline} style={{ margin: "20px" }}>
            <Row>
              <Col></Col>
              <Col>
                <Statistic title="Block Number" value={this.state.blockNumber} />

              </Col>
              <Col></Col>
            </Row>
            <Row>
              <Col>
                <Statistic title="Total Pool Amount" value={this.state.totalPool} />
              </Col>
              <Col>
                <Statistic title="Delegate Pool Amount" value={this.state.delegatePool} />
              </Col>
              <Col>
                <Statistic title="Demand Deposit Pool" value={this.state.demandDepositPool} />
              </Col>
            </Row>
            <Row>
              <Col>
                <Statistic title="Price Pool Amount" value={this.state.pricePool} />
              </Col>
              <Col>
                <Statistic title="Subsidy Amount" value={this.state.subsidyAmount} />
              </Col>
              <Col>
                <Statistic title="Stake Counts" value={this.state.stakeCounts} />
              </Col>
            </Row>
            <Row>
              <Col>
                <Statistic title="Redeem Counts" value={this.state.redeemCounts} />
              </Col>
              <Col>
                <Statistic title="Lottery Settlement Counts" value={this.state.lotterySettlementCounts} />
              </Col>
              <Col>
                <Statistic title="Win Counts" value={this.state.winCounts} />
              </Col>
            </Row>

          </div>
        </div>

        <div style={{ margin: "20px" }}>
          <h2>Delegate Information</h2>
          <Table columns={this.colum} dataSource={this.state.tableData} style={{ width: "300px", margin: "auto" }} />
        </div>
      </div>
    )
  }
}

export default Index;
