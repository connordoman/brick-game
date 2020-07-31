class Quadtree {
    constructor(boundary, capacity) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.points = [];
        this.divided = false;
    }

    insert(point) {
        if (!this.boundary.contains(point)) {
            return false;
        }

        if (this.points.length < this.capacity) {
            this.points.push(point);
            return true;
        } else {
            if (!this.divided) {
                this.subdivide();
            }
            
            if (this.quadrantOne.insert(point)) {
                return true
            } else if (this.quadrantTwo.insert(point)) {
                return true;
            } else if (this.quadrantThree.insert(point)) {
                return true;
            } else if (this.quadrantFour.insert(point)) {
                return true;
            }
        }
    }

    subdivide() {
        let x = this.boundary.x;
        let y = this.boundary.y;
        let w = this.boundary.w;
        let h = this.boundary.h;

        let q1 = new Rectangle(x + w / 2, y + h / 2, w / 2, h / 2);
        this.quadrantOne = new Quadtree(q1, this.capacity);
        let q2 = new Rectangle(x - w / 2, y + h / 2, w / 2, h / 2);
        this.quadrantTwo = new Quadtree(q2, this.capacity);
        let q3 = new Rectangle(x - w / 2, y - h / 2, w / 2, h / 2);
        this.quadrantThree = new Quadtree(q3, this.capacity);
        let q4 = new Rectangle(x + w / 2, y - h / 2, w / 2, h / 2);
        this.quadrantFour = new Quadtree(q4, this.capacity);

        this.divided = true;
    }

    query(range, found) {
        if (!found) {
            found = [];
        }
        if (!this.boundary.intersects(range)) {
            return;
        } else {
            for (let p of this.points) {
                if (range.contains(p)) {
                    found.push(p);
                }
            }
            if (this.divided) {
                this.quadrantOne.query(range, found);
                this.quadrantTwo.query(range, found);
                this.quadrantThree.query(range, found);
                this.quadrantFour.query(range, found);
            }
        }
        return found;
    }
}