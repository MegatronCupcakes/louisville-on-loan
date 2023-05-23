import React, {useCallback} from 'react';
import PropTypes from 'prop-types';
import _ from 'underscore';
import Pagination from '/imports/ui/pagination/pagination';

const PaginationContainer = (props) => {
    const pageCount = Math.ceil(props.count / props.pageSize);
    const handleSetCurrentPage = useCallback(_.debounce((_page, _currentPage) => {
        if(_page === 'previous'){
            if(_currentPage > 1){
                props.setOffset(Number(_currentPage) - 2);
            }
        } else if(_page === 'next'){
            if(_currentPage < pageCount){
                props.setOffset(Number(_currentPage));
            }
        } else {
            props.setOffset(Number(_page) - 1);
        }
    }, 400, true));
    return (
        <Pagination
            content={props.content}
            pageCount={pageCount}
            currentPage={props.offset + 1}
            setCurrentPage={handleSetCurrentPage}
        />
    );
};
PaginationContainer.propTypes = {
    content: PropTypes.array.isRequired,
    count: PropTypes.number,
    pageSize: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    setOffset: PropTypes.func.isRequired
};
export default PaginationContainer;
