import React, { useState } from 'react';
import PropTypes from 'prop-types';

export const Tabs = ({ children, defaultActiveKey }) => {
  const [activeKey, setActiveKey] = useState(defaultActiveKey);

  const tabHeaders = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return {
        key: child.props.eventKey,
        title: child.props.title
      };
    }
    return null;
  });

  const activeTab = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.props.eventKey === activeKey
  );

  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabHeaders.map((tab) => (
          <button
            key={tab.key}
            className={`tab-header ${activeKey === tab.key ? 'active' : ''}`}
            onClick={() => setActiveKey(tab.key)}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {activeTab}
      </div>
    </div>
  );
};

export const Tab = ({ children, title, eventKey }) => {
  return (
    <div className="tab-content" data-key={eventKey}>
      {children}
    </div>
  );
};

Tabs.propTypes = {
  children: PropTypes.node.isRequired,
  defaultActiveKey: PropTypes.string
};

Tab.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  eventKey: PropTypes.string.isRequired
};

Tabs.defaultProps = {
  defaultActiveKey: null
};
