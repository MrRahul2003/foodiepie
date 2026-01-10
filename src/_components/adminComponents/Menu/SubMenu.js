import React from "react";

function SubMenu() {
  return (
    <div className="col-lg-4 col-md-6 col-sm-12 mb-4">
      <div className="contact-list">
        <div className="contact-win">
          <div className="contact-img">
            <img src="img/post/1.jpg" alt="" />
          </div>
          <div className="conct-sc-ic">
            <a className="btn" href="#">
              <i className="notika-icon notika-facebook" />
            </a>
            <a className="btn" href="#">
              <i className="notika-icon notika-twitter" />
            </a>
            <a className="btn" href="#">
              <i className="notika-icon notika-pinterest" />
            </a>
          </div>
        </div>
        <div className="contact-ctn">
          <div className="contact-ad-hd">
            <h2>John Deo</h2>
            <p className="ctn-ads">USA, LA, aus</p>
          </div>
          <p>
            Lorem ipsum dolor sit amete of the, consectetur adipiscing elitable.
            Vestibulum tincidunt.
          </p>
        </div>
        <div className="social-st-list">
          <div className="social-sn">
            <h2>Likes:</h2>
            <p>956</p>
          </div>
          <div className="social-sn">
            <h2>Comments:</h2>
            <p>434</p>
          </div>
          <div className="social-sn">
            <h2>Views:</h2>
            <p>676</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubMenu;
