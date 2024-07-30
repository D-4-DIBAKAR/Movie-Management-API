class ApiFeature {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  //FILTERING
  filter() {
    // Advanced filtering (for gte, gt, lte, lt)
    let queryString = JSON.stringify(this.queryStr);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );
    const filteredQuery = JSON.parse(queryString);

    // Step 2: Building the query
    this.query = this.query;
    return this;
  }

  //SORTING
  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      // Default sorting by createdAt
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  //LIMITING
  limitFields() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  //PAGINATION
  paginate() {
    const page = this.queryStr.page * 1 || 1;
    const limit = this.queryStr.limit * 1 || 10; //100 is default value
    //PAGE 1:1-10,;PAGE 2:11-20;PAGE 3:21-30
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    // if (this.queryStr.page) {
    //   const moviesCount = await Movie.countDocuments();
    //   if (skip >= moviesCount) {
    //     throw new Error("This Page is not Found");
    //   }
    return this;
  }
}

module.exports = ApiFeature;
