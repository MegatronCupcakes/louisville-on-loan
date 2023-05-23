import React from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';

const Pagination = (props) => {
    return (
        <>
            <div className="col-12">
                {props.content}
            </div>
            <div className="col-12">
                <ul className="pagination justify-content-center">
                    <li className={props.currentPage === 1 ? "page-item disabled" : "page-item"} onClick={() => props.setCurrentPage("previous", props.currentPage)}>
                        <a className="page-link" aria-label="Previous">
                            <span aria-hidden="true">&laquo;</span>
                        </a>
                    </li>
                    {_.times(props.pageCount, (index) => {
                        return (
                            <li className={props.currentPage === index + 1 ? "page-item active" : "page-item"} key={index} onClick={() => props.setCurrentPage(index + 1, props.currentPage)}><a className="page-link" onClick={() => props.setCurrentPage(index + 1, props.currentPage)}>{index + 1}</a></li>
                        );
                    })}
                    <li className={props.currentPage === props.pageCount ? "page-item disabled" : "page-item"} onClick={() => props.setCurrentPage("next", props.currentPage)}>
                        <a className="page-link" aria-label="Next">
                            <span aria-hidden="true">&raquo;</span>
                        </a>
                    </li>
                </ul>
            </div>
        </>
    );
};
Pagination.propTypes = {
    //content: PropTypes.array.isRequired, // not always an array; score history, for example, is a table.
    pageCount: PropTypes.number.isRequired,
    currentPage: PropTypes.number.isRequired,
    setCurrentPage: PropTypes.func.isRequired
};
export default Pagination;
