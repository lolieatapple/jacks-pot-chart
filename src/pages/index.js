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
    {
      title: 'Delegated Amount',
      dataIndex: 'delegatedAmount',
      key: 'delegatedAmount',
    },
  ]

  columPlayer = [
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Tickets Count',
      dataIndex: 'ticketsCount',
      key: 'ticketsCount',
    },
    {
      title: "Total Stake Amount",
      dataIndex: "totalStakeAmount",
      key: "totalStakeAmount",
    }
  ]

  columCodes = [
    {
      title: 'Tickets',
      dataIndex: 'ticket',
      key: 'ticket',
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: 'Stake',
      dataIndex: 'stake',
      key: 'stake',
    }
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
      balance: 0,
      blockNumber: 0,
      closed: false,
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
      playerData: [],
      tickets:[],
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
    funcs.push(web3.eth.getBalance(scAddress));
    funcs.push(web3.eth.getBlockNumber());
    funcs.push(sc.methods.poolInfo().call());
    funcs.push(sc.getPastEvents('Buy', { fromBlock: 8865321 }));
    funcs.push(sc.getPastEvents('Redeem', { fromBlock: 8865321 }));
    funcs.push(sc.getPastEvents('LotteryResult', { fromBlock: 8865321 }));
    funcs.push(sc.methods.subsidyInfo().call());
    funcs.push(sc.methods.closed().call());


    const [balance, blockNumber, poolInfo, buyEvents, redeemEvents, settleEvents, subsidyInfo, closed] = await Promise.all(funcs);


    let winCounts = 0;
    for (let i = 0; i < settleEvents.length; i++) {
      if (settleEvents[i].returnValues.amounts && settleEvents[i].returnValues.amounts.length > 0 && Number(settleEvents[i].returnValues.amounts[0]) > 0) {
        winCounts++;
      }
    }

    let playerData = [];
    funcs = [];
    for (let i=0; i<buyEvents.length; i++) {
      funcs.push(sc.methods.getUserCodeList(buyEvents[i].returnValues.user).call());
    }

    let users = await Promise.all(funcs);

    let addresses = [];
    let tickets = [];
    let tmpTickets = [];
    for (let i=0; i<buyEvents.length; i++) {
      let totalStakeAmount = 0;
      for (let m=0; m<users[i].amounts.length; m++) {
        totalStakeAmount += Number(web3.utils.fromWei(users[i].amounts[m]));
      }

      let one = {
        address: buyEvents[i].returnValues.user.toLowerCase(),
        ticketsCount: users[i].codes.length,
        totalStakeAmount,
        key: i
      };

      if (Number(one.ticketsCount) > 0 && Number(one.totalStakeAmount) > 0 && !addresses.includes(one.address)) {
        playerData.push(one);
        addresses.push(one.address);
        for (let m=0; m<users[i].codes.length; m++) {
          if (!tmpTickets.includes(users[i].codes[m])) {
            tmpTickets.push(users[i].codes[m]);
            tickets.push({
              ticket:Number(users[i].codes[m]),
              count:1,
              stake: Number(web3.utils.fromWei(users[i].amounts[m]))
            });
          } else {
            let id = tmpTickets.indexOf(users[i].codes[m]);
            tickets[id].count++;
            tickets[id].stake += Number(web3.utils.fromWei(users[i].amounts[m]));
          }
        }
      }
    }

    tickets = tickets.sort((a,b)=>(a.ticket-b.ticket));
    console.log('tickets', tickets);

    funcs = [];

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
      balance: Number(web3.utils.fromWei(balance)).toFixed(1),
      blockNumber,
      closed,
      totalPool: (Number(web3.utils.fromWei(poolInfo.delegatePool)) + Number(web3.utils.fromWei(poolInfo.demandDepositPool)) + Number(web3.utils.fromWei(poolInfo.prizePool))).toFixed(1),
      delegatePool: Number(web3.utils.fromWei(poolInfo.delegatePool)).toFixed(1),
      demandDepositPool: Number(web3.utils.fromWei(poolInfo.demandDepositPool)).toFixed(1),
      pricePool: Number(web3.utils.fromWei(poolInfo.prizePool)).toFixed(1),
      stakeCounts: buyEvents.length,
      redeemCounts: redeemEvents.length,
      lotterySettlementCounts: settleEvents.length,
      winCounts,
      subsidyAmount: Number(web3.utils.fromWei(subsidyInfo.total)),
      tableData,
      playerData,
      tickets,
    })
  }

  render() {
    let rank = this.state.playerData.slice();
    rank = rank.sort((a, b)=>(b.totalStakeAmount-a.totalStakeAmount));
    return (
      <div>
        <div className={styles.app + ' ' + styles.inline}>
          <div>
            <div className={styles.inline} style={{ margin: "20px" }}>
              <Row>
                <Col>
                  <Statistic title="Block Number" value={this.state.blockNumber} />
                </Col>
                <Col>
                  <Statistic title="Smart Contract Balance" value={this.state.balance} />
                </Col>
                <Col>
                  <Statistic title="Is Closed" value={this.state.closed} />
                </Col>
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
        <div style={{ margin: "20px" }}>
          <h2>Players Rankings (Total {this.state.playerData.length})</h2>
          <Table columns={this.columPlayer} dataSource={rank} style={{ margin: "auto" }} />
        </div>
        <div style={{ margin: "20px" }}>
          <h2>Tickets Pool (Total {this.state.tickets.length})</h2>
          <Table columns={this.columCodes} dataSource={this.state.tickets} style={{ margin: "auto" }} />
        </div>
      </div>
    )
  }
}

export default Index;
