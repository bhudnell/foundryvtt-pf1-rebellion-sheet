export function getRankFromSupporters(supporters) {
	if (supporters > 5349) return 20
	if (supporters > 3849) return 19
	if (supporters > 2699) return 18
	if (supporters > 1899) return 17
	if (supporters > 1349) return 16
	if (supporters > 954) return 15
	if (supporters > 664) return 14
	if (supporters > 474) return 13
	if (supporters > 329) return 12
	if (supporters > 234) return 11
	if (supporters > 159) return 10
	if (supporters > 104) return 9
	if (supporters > 74) return 8
	if (supporters > 54) return 7
	if (supporters > 39) return 6
	if (supporters > 29) return 5
	if (supporters > 19) return 4
	if (supporters > 14) return 3
	if (supporters > 9) return 2
	return 1
}