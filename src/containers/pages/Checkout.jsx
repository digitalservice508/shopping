import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import { connect } from "react-redux";
import { confirmOrder, setPromoCode } from "../../store/actions/shop";
import CustomerInputs from "../../components/Checkout/Forms/CustomerInputs";
import PaymentOptions from "../../components/Checkout/Forms/Payments/PaymentOptions";
import Alert from "../../components/UI/Alert/Alert";
import PropTypes from "prop-types";
import formValidator from "../../Utility/formValidation";
import { CardElement, injectStripe } from "react-stripe-elements";

class Checkout extends Component {
  state = {
    promoCode: "",
    showAlert: false,
    alertType: "",
    alertMessage: "",
    paymentMethod: "creditCard",
    shippingPrice: 300,
    usedDeliveryOption: 1,
    makeOrder: false,
    correctCardInfo: false,
    customerInfo: {
      firstName: {
        value: "",
        valid: false,
        touched: false,
        errorsMsg: "",
      },
      secondName: {
        value: "",
        valid: false,
        touched: false,
        errorsMsg: "",
      },
      email: {
        value: "",
        valid: false,
        touched: false,
        errorsMsg: "",
      },
      amount: {
        value: "",
        valid: false,
        touched: false,
        errorsMsg: "",
      },
      nameOnCard: {
        value: "",
        valid: false,
        touched: false,
        errorsMsg: "",
      },
      billingAddress: {
        value: "",
        valid: false,
        touched: false,
        errorsMsg: "",
      },
      zipCode: {
        value: "",
        valid: false,
        touched: false,
        errorsMsg: "",
      },    
    },
  };

  customerInfoChangeHandler = (event, identifier) => {
    // use deep cloning to be able to get the values of nested objects
    const customerInfo = { ...this.state.customerInfo };
    const customerInfoField = { ...customerInfo[identifier] };
    customerInfoField.value = event.target.value;
    const validationResults = formValidator(
      identifier,
      customerInfoField.value
    );
    customerInfoField.valid = validationResults.isValid;
    customerInfoField.errorsMsg = validationResults.errorsMsg;
    customerInfoField.touched = true;
    customerInfo[identifier] = customerInfoField;

    let makeOrder = true;
    for (let identifier in customerInfo) {
      makeOrder = customerInfo[identifier].valid && makeOrder;
    }
    this.setState({ customerInfo: customerInfo, makeOrder: makeOrder });
  };

  promoCodeChangeHandler = (event) => {
    this.setState({ promoCode: event.target.value });
  };

  confirmOrderHandler = (event) => {
    event.preventDefault();
    let order = {};
    order["user"] = {
      firstName: this.state.customerInfo.firstName.value,
      secondName: this.state.customerInfo.secondName.value,
      email: this.state.customerInfo.email.value,
      amount: this.state.customerInfo.amount.value,
      nameOnCard: this.state.customerInfo.nameOnCard.value,
      billingAddress: this.state.customerInfo.billingAddress.value,
      zipCode: this.state.customerInfo.zipCode.value
    };
  };

  setPromoCode = (event) => {
    event.preventDefault();
    // check promo code in state
    let getPromoCode = this.props.promoCodeProp.filter(
      (codeName) => codeName.code === this.state.promoCode
    );

    if (getPromoCode.length > 0) {
      this.props.setPromoCodeProp(getPromoCode[0]);
      this.setState({
        showAlert: true,
        alertType: "alert-success",
        alertMessage: `The promo code you entered has given you a ${
          getPromoCode[0].percentage
        }% discount on the total price.`,
      });
    } else {
      this.setState({
        showAlert: true,
        alertType: "alert alert-danger",
        alertMessage: "The Promo code you entered does not have discounts",
      });
    }
  };

  closeAlertHandler = () => {
    this.setState({
      showAlert: !this.state.showAlert,
      alertType: "",
      alertMessage: "",
    });
  };

  deliveryOptionChangeHandler = (event) => {
    //get used delivery option from the state
    let deliveryOption = this.props.deliveryOptions.find(
      (option) => option.id === parseInt(event.target.value)
    );
    if (deliveryOption) {
      this.setState({
        usedDeliveryOption: parseInt(event.target.value),
        shippingPrice: deliveryOption.cost,
      });
    }
  };

  creditCardHandler = (element) => {
    if (element.complete) {
      this.setState({ correctCardInfo: true });
    }
  };

  render() {
    let productsPrices = [];
    let chosenPaymentMethod = null;
    let currencyKeys = Object.keys(this.props.usedCurrencyProp);
    let currencyValue = this.props.usedCurrencyProp[currencyKeys[0]];

    let shippingPrice = this.state.shippingPrice
      ? Math.round(this.state.shippingPrice * currencyValue)
      : 0;
    let productTotals = productsPrices.reduce(
      (acc, el) => acc + el.price * el.count,
      0
    );
    let vatPercentage = this.props.vatProps > 0 ? this.props.vatProps / 100 : 0;
    let vat = productTotals > 0 ? Math.round(productTotals * vatPercentage) : 0;
    let percentageDiscount = this.props.usedPromoCodeProp
      ? this.props.usedPromoCodeProp.percentage / 100
      : 0;
    let discountAmount = productTotals * percentageDiscount;
    let shoppingTotal =
      productTotals > 0
        ? productTotals + vat + shippingPrice - discountAmount
        : 0;

    if (this.state.paymentMethod === "creditCard") {
      chosenPaymentMethod = (
        <div className={"ml-4 p-3 shop-card-field"}>
          <CardElement
            onChange={(element) => this.creditCardHandler(element)}
          />
        </div>
      );
    }
    return (
      <div className="container py-4">
        {this.props.cartTotalProps <= 0 ? <Redirect to="/cart" /> : null}

        {this.state.showAlert ? (
          <Alert
            alertType={this.state.alertType}
            closeAlert={this.closeAlertHandler}
          >
            {this.state.alertMessage}
          </Alert>
        ) : null}

        <div className="row">
          <div className="col-md-12 order-md-1 ">
            <h4 className="mb-3">Billing Information</h4>
            <form className="shop-form shop-bg-white p-3" noValidate>
              <CustomerInputs
                customerInfo={this.state.customerInfo}
                inputChanged={(event, identifier) =>
                  this.customerInfoChangeHandler(event, identifier)
                }
              />
              <h4 className="mb-3">Payment Method</h4>
              <PaymentOptions
                paymentMethod={this.state.paymentMethod}
              />
              <div>{chosenPaymentMethod}</div>
              <hr className="mb-4" />
              <button
                // disabled={!(this.state.makeOrder && this.state.correctCardInfo)}
                className="btn shop-btn-secondary btn-lg btn-block"
                onClick={(event) => this.confirmOrderHandler(event)}
              >
                Confirm Order
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

Checkout.propTypes = {
  productsProps: PropTypes.array.isRequired,
  cartProductsProps: PropTypes.array.isRequired,
  cartTotalProps: PropTypes.number.isRequired,
  promoCodeProp: PropTypes.array,
  usedPromoCodeProp: PropTypes.object,
  deliveryOptions: PropTypes.array.isRequired,
  usedCurrencyProp: PropTypes.object.isRequired,
  vatProps: PropTypes.number,
};

Checkout.defaultProps = {
  shippingPriceProp: 0,
};

const mapStateToProps = (state) => {
  return {
    productsProps: state.products,
    cartProductsProps: state.cart,
    cartTotalProps: state.cartTotal,
    vatProps: state.vat,
    promoCodeProp: state.promoCode,
    usedPromoCodeProp: state.usedPromoCode,
    deliveryOptions: state.deliveryOptions,
    usedCurrencyProp: state.usedCurrency,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    confirmOrderProp: (order) => dispatch(confirmOrder(order, ownProps)),
    setPromoCodeProp: (promoCode, percentage) =>
      dispatch(setPromoCode(promoCode, percentage)),
  };
};

// inject stripe prop into the component
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(injectStripe(Checkout));
