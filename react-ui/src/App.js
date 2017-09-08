import React, { Component } from 'react';
import axios from 'axios';
import { get } from 'lodash';

import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      faviconUrl: '',
      requestUrl: '',
      errorMsg: '',
    };
    this.handleGetFavicon = this.handleGetFavicon.bind(this);
    this.handleChangeInput = this.handleChangeInput.bind(this);
  }

  handleGetFavicon() {
    axios
      .get(`/api/v1/favicon?lookup-url=${this.state.requestUrl}`)
      .then((res) => {
        this.setState({
          faviconUrl: get(res, 'data.faviconUrl', ''),
          errorMsg: '',
        });
      })
      .catch((error) => {
        this.setState({
          faviconUrl: '',
          errorMsg: get(
            error,
            'response.data.error',
            'Whoops, there was a problem!',
          ),
        });
        console.error(error);
      });
  }

  handleChangeInput(event) {
    this.setState({ requestUrl: event.target.value });
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h2>Let's Go Favico!</h2>
        </div>
        <p className="App-intro">
          Enter a webpage URL to retrieve its favicon.
        </p>
        <input
          id="url"
          type="text"
          onChange={this.handleChangeInput}
          value={this.state.requestUrl}
          placeholder="example.com"
        />
        <button onClick={this.handleGetFavicon}>Go!</button>
        <FaviconImage
          errorMsg={this.state.errorMsg}
          faviconUrl={this.state.faviconUrl}
        />
      </div>
    );
  }
}

const FaviconImage = function (props, context) {
  return (
    <div className="favicon-container">
      <img src={props.faviconUrl} />
      {props.faviconUrl === false ? 'Unavailable :(' : ''}
      {props.errorMsg}
    </div>
  );
};

export default App;
