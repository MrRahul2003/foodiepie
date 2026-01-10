import React from 'react'

function StatusArea() {
  return (
<div className="notika-status-area">
  <div className="container">
    <div className="row">
      <div className="col-lg-3 col-md-6 col-sm-6 col-xs-12">
        <div className="wb-traffic-inner notika-shadow sm-res-mg-t-30 tb-res-mg-t-30">
          <div className="website-traffic-ctn">
            <h2>
              <span className="counter">0</span>
            </h2>
            <p>Session Orders</p>
          </div>
          <div className="sparkline-bar-stats1">9,4,8,6,5,6,4,8,3,5,9,5</div>
        </div>
      </div>
      <div className="col-lg-3 col-md-6 col-sm-6 col-xs-12">
        <div className="wb-traffic-inner notika-shadow sm-res-mg-t-30 tb-res-mg-t-30">
          <div className="website-traffic-ctn">
            <h2>
              <span className="counter">0</span>
            </h2>
        <p>Session Revenue</p>
          </div>
          <div className="sparkline-bar-stats2">1,4,8,3,5,6,4,8,3,3,9,5</div>
        </div>
      </div>
      <div className="col-lg-3 col-md-6 col-sm-6 col-xs-12">
        <div className="wb-traffic-inner notika-shadow sm-res-mg-t-30 tb-res-mg-t-30 dk-res-mg-t-30">
          <div className="website-traffic-ctn">
            <h2>
              $<span className="counter">0</span>
            </h2>
            <p>Active Orders</p>
          </div>
          <div className="sparkline-bar-stats3">4,2,8,2,5,6,3,8,3,5,9,5</div>
        </div>
      </div>
      <div className="col-lg-3 col-md-6 col-sm-6 col-xs-12">
        <div className="wb-traffic-inner notika-shadow sm-res-mg-t-30 tb-res-mg-t-30 dk-res-mg-t-30">
          <div className="website-traffic-ctn">
            <h2>
              <span className="counter">0</span>
            </h2>
            <p>Served Orders</p>
          </div>
          <div className="sparkline-bar-stats4">2,4,8,4,5,7,4,7,3,5,7,5</div>
        </div>
      </div>
    </div>
  </div>
</div>

  )
}

export default StatusArea
