let utils = require('./utils.js')

let ico = artifacts.require("./CoinPokerICO.sol");
let token = artifacts.require("./CoinPokerToken.sol");

let maxGoal = 275000000e18; // 350 Milion CoinPoker Tokens for ICO
let tokensForSaleTotal = 375000000e18; // 75% of total for sale
let team_reserve = 50000000e18; // 25% of total for team
let tokensPreICO = 100000000e18; // 20% of total for pre-ico
let tournaments_reserve_max = 75000000e18; // 25% of total for tournaments reserve
let start = 1517230800; // Monday, 29 January 2018 13:00:00
let end = 1518440400; // Monday, 12 February 2018 13:00:00
let owner = "0x376c9fde9555e9a491c4cd8597ca67bb1bbf397e";
let pre_ico_wallet = "0xcb88efbfb68a1e6d8a4b0bcf504b6bb6bd623444";
let tournaments_wallet = "0x0cbe666498dd2bb2f85b644b5f882e4136ac9558";
let tokenInstance, icoInstance;
let prices = [4200, 3850, 3500];
let amount_stages = [100000000e18, 175000000e18, 275000000e18];
let logging = false;

contract('ico', accounts => {
         
         before(async() => {
                tokenInstance = await token.new(owner, pre_ico_wallet, tournaments_wallet);
                icoInstance = await ico.new(
                                            tokenInstance.address,
                                            owner,
                                            owner
                                            );
                });
         
         it("test initialization", async() => {
            let mGoal = await icoInstance.maxGoal.call();
            assert.equal(mGoal.toNumber(), maxGoal, "wrong max goal");
            if (logging) console.log('maxGoal: ' + mGoal.toNumber());
            
            let icoStartTime = await icoInstance.start.call();
            assert.equal(icoStartTime.toNumber(), start, "wrong start date");
            
            let icoEndTime = await icoInstance.end.call();
            assert.equal(icoEndTime.toNumber(), end, "wrong end date");
            if (logging) console.log('ico starts: ' + new Date(start * 1e3).toISOString());
        });
         
         it("should fail to buy tokens, because too early", async() => {
            let result;
            try {
                result = await icoInstance.invest(accounts[2], {value: web3.toWei(300, "ether")});
                throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
            } catch (error) {
                let balance = await tokenInstance.balances.call(accounts[2]);
                assert.equal(balance.toNumber(), 0);
            }
        });
         
          it("test prices and token amounts in each period", async() => {
             await icoInstance.setCurrent(start);
             
             let price = await icoInstance.getPrice.call();
             if (logging) console.log('current price: ' + price.toNumber());
             assert.equal(price.toNumber(), prices[0], "current price is incorrect");
             
             let price0 = await icoInstance.prices.call(0);
             if (logging) console.log('price[0]: ' + price0.toNumber());
             assert.equal(price0.toNumber(), prices[0], "price[0] is incorrect");
             
             let price1 = await icoInstance.prices.call(1);
             if (logging) console.log('price[1]: ' + price1.toNumber());
             assert.equal(price1.toNumber(), prices[1], "price[1] is incorrect");
             
             let prices2 = await icoInstance.prices.call(2);
             if (logging) console.log('price[2]: ' + prices2.toNumber());
             assert.equal(prices2.toNumber(), prices[2], "price[2] is incorrect");
             
             let amount0 = await icoInstance.amount_stages.call(0);
             if (logging) console.log('amount_stages[0]: ' + amount0.toNumber());
             assert.equal(amount0.toNumber(), amount_stages[0], "amount[0] is incorrect");
             
             let amount1 = await icoInstance.amount_stages.call(1);
             if (logging) console.log('amount_stages[1]: ' + amount1.toNumber());
             assert.equal(amount1.toNumber(), amount_stages[1], "amount[1] is incorrect");
             
             let amount2 = await icoInstance.amount_stages.call(2);
             if (logging) console.log('amount_stages[2]: ' + amount2.toNumber());
             assert.equal(amount2.toNumber(), amount_stages[2], "amount[2] is incorrect");
             
         });
         
         
         it("should buy some CHP during stage-1", async() => {
            await icoInstance.setCurrent(start);
            let approve_result = await tokenInstance.approve(icoInstance.address, maxGoal);
            let result = await icoInstance.invest(accounts[1], {value: web3.toWei(1, "ether")});
            let event = result.logs[0].args;
            assert.equal(event.amount.toNumber(), web3.toWei(1, "ether"));
           
            let token_balance = await tokenInstance.balances.call(accounts[1]);
            assert.equal(token_balance.toNumber(), 4200e18, "token amount doesn't match during pre-ico");
            if (logging) console.log('token amount bought during stage-1: ' + token_balance.toNumber());
            
            let amount_balance = await icoInstance.balances.call(accounts[1]);
            assert.equal(amount_balance.toNumber(), web3.toWei(1, "ether"), "spend amount doesn't match during stage-1");
            
            let token_sold = await icoInstance.tokensSold.call();
            if (logging) console.log('token_sold during stage-1: ' + token_sold);
            
            let amountRaised = await icoInstance.amountRaised.call();
            if (logging) console.log('amountRaised during stage-1: ' + amountRaised);
            assert.equal(amountRaised.toNumber(), web3.toWei(1, "ether"), "amount raised incorrect during stage-1");
        });
         
         it("should buy CHP amount and go to stage-2", async() => {
            result = await icoInstance.invest(accounts[2], {value: web3.toWei(24000, "ether")});
            let event = result.logs[0].args;
            assert.equal(event.amount.toNumber(), web3.toWei(24000, "ether"));
            
            let token_sold = await icoInstance.tokensSold.call();
            if (logging) console.log('token_sold: ' + token_sold);
            
            let price = await icoInstance.getPrice.call();
            if (logging) console.log('current price: ' + price.toNumber());
            assert.equal(price.toNumber(), prices[1], "current price is incorrect");
            
            let amountRaised = await icoInstance.amountRaised.call();
            if (logging) console.log('amountRaised: ' + amountRaised);
            assert.equal(amountRaised.toNumber(), web3.toWei(24001, "ether"), "amount raised incorrect during stage-1");
        });
         
         it("should buy CHP amount and go to stage-3", async() => {
            result = await icoInstance.invest(accounts[2], {value: web3.toWei(21000, "ether")});
            let event = result.logs[0].args;
            assert.equal(event.amount.toNumber(), web3.toWei(21000, "ether"));
            
            let token_sold = await icoInstance.tokensSold.call();
            if (logging) console.log('token_sold: ' + token_sold);
            
            let price = await icoInstance.getPrice.call();
            if (logging) console.log('current price: ' + price.toNumber());
            assert.equal(price.toNumber(), prices[2], "current price is incorrect");
            
            let amountRaised = await icoInstance.amountRaised.call();
            if (logging) console.log('amountRaised: ' + amountRaised);
            assert.equal(amountRaised.toNumber(), web3.toWei(45001, "ether"), "amount raised incorrect during stage-2");
        });
         
       
         it("should fail to buy tokens because of the max goal", async() => {
            let investorBalance = await tokenInstance.balances.call(accounts[2]);
            try {
                let result = await icoInstance.invest(accounts[2], {value: web3.toWei(700000, "ether")});
                throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
            } catch (error) {
                let bal = await tokenInstance.balances.call(accounts[2]);
                assert.equal(bal.toNumber(), investorBalance.toNumber());
            }
        });
         
         it("should fail to buy tokens with too low msg.value", async() => {
            try {
                let result = await icoInstance.invest(accounts[7], {value: web3.toWei(0.0, "ether") });
                throw new Error('Promise was unexpectedly fulfilled. Result: ' + result);
            } catch (error) {
                let bal = await tokenInstance.balances.call(accounts[7]);
                assert.equal(bal.toNumber(), 0);
            }
        });
         
         it("should fail to close crowdsale because too early", async() => {
            await icoInstance.checkGoalReached({from: owner});
            let reached = await icoInstance.crowdsaleEnded.call();
            assert.equal(reached, false, "crowdsale end shouldn't be reached");
        });
         
         it("should close the crowdsale. goal should be reached. Should burn unsold tokens.", async() => {
            let bal_before = await tokenInstance.balances(accounts[0]);
            if (logging) console.log('bal_before: ' + bal_before);
            await icoInstance.setCurrent(end+10);
            await tokenInstance.setCurrent(end+10);
            let result = await icoInstance.checkGoalReached({from: owner});
            console.log('result log: ' + JSON.stringify(result.logs[0]));
            
            let closed = await icoInstance.crowdsaleEnded.call();
            assert.equal(closed, true, "crowdsale should be already closed");

            // check team reserve
            let bal = await tokenInstance.balances(accounts[0]);
            if (logging) console.log('team_reserve: ' + bal);
            assert.equal(bal.toNumber(), team_reserve, "incorrect reserved amount");
            
            // check pre-ico reserve
            let pre_ico_balance = await tokenInstance.balances.call(accounts[8]);
            if (logging) console.log('pre-ico reserve: ' + pre_ico_balance);
            assert.equal(pre_ico_balance.toNumber(), tokensPreICO, 'incorrect pre-ico balance');
            
            // check tournament reserve
            let tokens_sold = tokensPreICO + (4200 + 24000 * 4200 + 21000 * 3850) * 1e18;
            if (logging) console.log('tokens_sold: ' + tokens_sold);
            let tournament_amount = ((tournaments_reserve_max / 1e18) * ((tokens_sold / 1e18) / (tokensForSaleTotal / 1e18) )) * 1e18;
            tournament_amount /= 1e21;
            tournament_amount = Math.round(tournament_amount) * 1e21;
            if (logging) console.log('tournament_amount: ' + tournament_amount);
            let tournaments_burned = tournaments_reserve_max - tournament_amount;
            // for tournaments
            let tournaments_balance = await tokenInstance.balances.call(accounts[7]);
            assert.equal(tournaments_balance.toNumber(), tournament_amount, 'incorrect tournaments reserve');
            
            // check supply after burn
            let supply = await tokenInstance.totalSupply.call();
            if (logging) console.log('supply: ' + supply);
            assert.equal(supply.toNumber(), team_reserve + tournament_amount + tokens_sold , "incorrect total supply after burning");
        });
         
         it("should fund the crowdsale contract from the owner's wallet", async() => {
            await icoInstance.sendTransaction({value: web3.toWei(20000, "ether")});
            assert.equal(web3.eth.getBalance(icoInstance.address).toNumber(), web3.toWei(20000, "ether"));
        });
         
         it("should withdraw the invested amount", async() => {
            let balanace_before = await icoInstance.balances.call(accounts[1]);
            if (logging) console.log('balance_before: ' + balanace_before);
            let result = await icoInstance.safeWithdrawal({from: accounts[1]});
            let balance = await icoInstance.balances.call(accounts[1]);
            assert.equal(balance.toNumber(), 0);
            if (logging) console.log('balance_after: ' + balance);
        });
    
});


